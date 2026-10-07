<?php

namespace App\Http\Controllers;

use App\Models\Lesson;
use App\Models\UserCourse;
use App\Models\UserLessonProgress;
use App\Http\Resources\LessonResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use App\Models\UserCategoryEnrollment;
use App\Models\Course;
use App\Models\VideoWatchSession;

class UserLessonController extends Controller
{
    /**
     * Display a lesson and update user progress
     */
    public function show($id)
    {
        $lesson = Lesson::with(['chapter.course'])->find($id);
        
        if (!$lesson) {
            return response()->json([
                'message' => 'Lesson not found'
            ], 404);
        }

        $user = Auth::user();
        $course = $lesson->chapter->course;
        
        // تحديث التحقق: السماح إذا كان مسجلاً مباشرة أو مسجلاً بشكل نشط في الدبلومة الأم
        $hasCourseEnrollment = UserCourse::where('user_id', $user->id)
                                        ->where('course_id', $course->id)
                                        ->exists();

        $hasActiveDiplomaEnrollment = false;
        if (!empty($course->category_id)) {
            $hasActiveDiplomaEnrollment = UserCategoryEnrollment::where('user_id', $user->id)
                ->where('category_id', $course->category_id)
                ->where('status', 'active')
                ->exists();
        }
        
        if (!($hasCourseEnrollment || $hasActiveDiplomaEnrollment)) {
            return response()->json([
                'message' => 'You are not enrolled in this course'
            ], 403);
        }

        // Track lesson progress
        $lessonProgress = UserLessonProgress::firstOrCreate(
            [
                'user_id' => $user->id,
                'lesson_id' => $id
            ],
            [
                'status' => 'in_progress',
                'started_at' => now()
            ]
        );

        // If lesson wasn't completed before, mark as in progress
        if ($lessonProgress->status === 'not_started') {
            $lessonProgress->update([
                'status' => 'in_progress',
                'started_at' => now()
            ]);
        }

        $this->touchTrackingStartMetadata($lessonProgress);

        // Update course progress
        $this->updateCourseProgress($user->id, $course->id);

        return response()->json([
            'message' => 'Lesson fetched successfully',
            'lesson' => new LessonResource($lesson),
        ]);
    }

    /**
     * Mark lesson as completed
     */
    public function complete(Request $request, $id)
    {
        $lesson = Lesson::with(['chapter.course'])->find($id);
        
        if (!$lesson) {
            return response()->json([
                'message' => 'Lesson not found'
            ], 404);
        }

        $user = Auth::user();
        $course = $lesson->chapter->course;
        
        // تحقق الوصول: تسجيل مباشر أو تسجيل دبلومة نشط
        $hasCourseEnrollment = UserCourse::where('user_id', $user->id)
            ->where('course_id', $course->id)
            ->exists();

        $hasActiveDiplomaEnrollment = false;
        if (!empty($course->category_id)) {
            $hasActiveDiplomaEnrollment = UserCategoryEnrollment::where('user_id', $user->id)
                ->where('category_id', $course->category_id)
                ->where('status', 'active')
                ->exists();
        }

        if (!($hasCourseEnrollment || $hasActiveDiplomaEnrollment)) {
            return response()->json([
                'message' => 'You are not enrolled in this course'
            ], 403);
        }

        // Check if this is the first time completing this lesson
        $existingProgress = UserLessonProgress::where('user_id', $user->id)
            ->where('lesson_id', $id)
            ->first();
        
        $isFirstCompletion = !$existingProgress || $existingProgress->status !== 'completed';

        $completionData = [
            'status' => 'completed',
            'completed_at' => now(),
            'started_at' => now() // In case it wasn't started before
        ];

        if ($this->isVideoTrackingEnabled() && $this->hasProgressTrackingColumns()) {
            $sessionId = $request->input('session_id');
            $completionSource = $request->input('completion_source', 'manual');
            if (!in_array($completionSource, ['tracking', 'manual', 'legacy'], true)) {
                $completionSource = 'manual';
            }

            $completionData = array_merge($completionData, [
                'progress_percentage' => 100,
                'last_watched_at' => now(),
                'first_started_at' => $existingProgress?->first_started_at ?? $existingProgress?->started_at ?? now(),
                'completed_by' => $sessionId ? 'watch_session:' . (int) $sessionId : 'manual',
                'completion_source' => $completionSource,
            ]);
        }

        // Mark lesson as completed
        $lessonProgress = UserLessonProgress::updateOrCreate(
            [
                'user_id' => $user->id,
                'lesson_id' => $id
            ],
            $completionData
        );

        // Increment view counters only on first completion
        if ($isFirstCompletion) {
            // Increment lesson views
            $lesson->increment('views');

            // Increment course total_views
            $course->increment('total_views');

            // Increment diploma total_ if course belongs to a diploma
            if (!empty($course->category_id)) {
                \App\Models\CategoryOfCourse::where('id', $course->category_id)
                    ->increment('total_views');
            }
        }

        // Update course progress
        $this->updateCourseProgress($user->id, $course->id);

        if ($this->isVideoTrackingEnabled()) {
            $this->markOptionalWatchSessionCompleted($request, $lesson, $user->id);
        }

        $progressPayload = [
            'status' => $lessonProgress->status,
            'started_at' => $lessonProgress->started_at,
            'completed_at' => $lessonProgress->completed_at
        ];

        if ($this->isVideoTrackingEnabled() && $this->hasProgressTrackingColumns()) {
            $progressPayload['progress_percentage'] = (float) ($lessonProgress->progress_percentage ?? 100);
            $progressPayload['watch_duration_seconds'] = (int) ($lessonProgress->watch_duration_seconds ?? 0);
            $progressPayload['last_watched_at'] = $lessonProgress->last_watched_at;
            $progressPayload['last_position_seconds'] = (int) ($lessonProgress->last_position_seconds ?? 0);
            $progressPayload['completion_source'] = $lessonProgress->completion_source;
        }

        return response()->json([
            'message' => 'Lesson marked as completed',
            'progress' => $progressPayload
        ]);
    }

    /**
     * Update course progress based on completed lessons
     */
    private function updateCourseProgress($userId, $courseId)
    {
        // Get total lessons in course
        $totalLessons = Lesson::whereHas('chapter', function($query) use ($courseId) {
            $query->where('course_id', $courseId);
        })->count();

        // Get completed lessons by user
        $completedLessons = UserLessonProgress::where('user_id', $userId)
            ->where('status', 'completed')
            ->whereHas('lesson.chapter', function($query) use ($courseId) {
                $query->where('course_id', $courseId);
            })
            ->count();

        // Calculate progress percentage
        $progressPercentage = $totalLessons > 0 ? round(($completedLessons / $totalLessons) * 100, 2) : 0;

        // Update user course progress
        $userCourse = UserCourse::where('user_id', $userId)
            ->where('course_id', $courseId)
            ->first();

        // إذا لا يوجد سجل للمقرر لكن الوصول عبر الدبلومة نشط، أنشئ سجلًا لبدء التقدم
        if (!$userCourse) {
            $course = Course::find($courseId);
            if ($course && !empty($course->category_id)) {
                $hasActiveDiplomaEnrollment = UserCategoryEnrollment::where('user_id', $userId)
                    ->where('category_id', $course->category_id)
                    ->where('status', 'active')
                    ->exists();
                if ($hasActiveDiplomaEnrollment) {
                    $userCourse = UserCourse::create([
                        'user_id' => $userId,
                        'course_id' => $courseId,
                        'status' => 'in_progress',
                        'progress_percentage' => 0,
                    ]);
                }
            }
        }

        if ($userCourse) {
            $status = 'in_progress';
            $completedAt = null;

            // If all lessons are completed, mark course as completed
            if ($progressPercentage >= 100) {
                $status = 'completed';
                $completedAt = now();
            }

            $userCourse->update([
                'progress_percentage' => $progressPercentage,
                'status' => $status,
                'completed_at' => $completedAt
            ]);
        }
    }

    /**
     * Get user's lesson progress for a course
     */
    public function getCourseProgress($courseId)
    {
        $user = Auth::user();
        $course = Course::find($courseId);
        
        // تحقق الوصول: تسجيل مباشر أو تسجيل دبلومة نشط
        $hasCourseEnrollment = UserCourse::where('user_id', $user->id)
            ->where('course_id', $courseId)
            ->exists();

        $hasActiveDiplomaEnrollment = false;
        if ($course && !empty($course->category_id)) {
            $hasActiveDiplomaEnrollment = UserCategoryEnrollment::where('user_id', $user->id)
                ->where('category_id', $course->category_id)
                ->where('status', 'active')
                ->exists();
        }

        if (!($hasCourseEnrollment || $hasActiveDiplomaEnrollment)) {
            return response()->json([
                'message' => 'You are not enrolled in this course'
            ], 403);
        }

        // تأكد من وجود سجل المقرر وتحديث التقدم
        $this->updateCourseProgress($user->id, $courseId);
        $enrollment = UserCourse::where('user_id', $user->id)
            ->where('course_id', $courseId)
            ->first();

        // Get lesson progress
        $lessonProgress = UserLessonProgress::where('user_id', $user->id)
            ->whereHas('lesson.chapter', function($query) use ($courseId) {
                $query->where('course_id', $courseId);
            })
            ->with('lesson')
            ->get();

        $hasTrackingColumns = $this->isVideoTrackingEnabled() && $this->hasProgressTrackingColumns();
        $watchDurationSeconds = 0;
        $lastWatchedLesson = null;

        if ($hasTrackingColumns) {
            $watchDurationSeconds = (int) UserLessonProgress::where('user_id', $user->id)
                ->whereHas('lesson.chapter', function($query) use ($courseId) {
                    $query->where('course_id', $courseId);
                })
                ->sum('watch_duration_seconds');

            $latestProgress = UserLessonProgress::where('user_id', $user->id)
                ->whereHas('lesson.chapter', function($query) use ($courseId) {
                    $query->where('course_id', $courseId);
                })
                ->whereNotNull('last_watched_at')
                ->with('lesson')
                ->orderByDesc('last_watched_at')
                ->first();

            if ($latestProgress) {
                $lastWatchedLesson = [
                    'lesson_id' => $latestProgress->lesson_id,
                    'lesson_title' => $latestProgress->lesson?->title,
                    'last_watched_at' => $latestProgress->last_watched_at,
                    'last_position_seconds' => (int) ($latestProgress->last_position_seconds ?? 0),
                ];
            }
        }

        $lessons = $lessonProgress->map(function($progress) use ($hasTrackingColumns) {
            $payload = [
                'lesson_id' => $progress->lesson_id,
                'lesson_title' => $progress->lesson->title,
                'status' => $progress->status,
                'quiz_passed' => (bool) ($progress->quiz_passed ?? false),
                'started_at' => $progress->started_at,
                'completed_at' => $progress->completed_at
            ];

            if ($hasTrackingColumns) {
                $payload['progress_percentage'] = (float) ($progress->progress_percentage ?? 0);
                $payload['watch_duration_seconds'] = (int) ($progress->watch_duration_seconds ?? 0);
                $payload['last_watched_at'] = $progress->last_watched_at;
                $payload['last_position_seconds'] = (int) ($progress->last_position_seconds ?? 0);
            }

            return $payload;
        });

        $courseProgress = [
            'overall_progress' => $enrollment->progress_percentage,
            'status' => $enrollment->status,
            'completed_at' => $enrollment->completed_at,
            'lessons' => $lessons
        ];

        if ($hasTrackingColumns) {
            $courseProgress['watch_duration_seconds'] = $watchDurationSeconds;
            $courseProgress['last_watched_lesson'] = $lastWatchedLesson;
        }

        return response()->json([
            'course_progress' => $courseProgress
        ]);
    }

    private function touchTrackingStartMetadata(UserLessonProgress $lessonProgress): void
    {
        if (!$this->isVideoTrackingEnabled() || !$this->hasProgressTrackingColumns()) {
            return;
        }

        $updates = [
            'last_watched_at' => now(),
        ];

        if (empty($lessonProgress->first_started_at)) {
            $updates['first_started_at'] = $lessonProgress->started_at ?? now();
        }

        $lessonProgress->update($updates);
    }

    private function markOptionalWatchSessionCompleted(Request $request, Lesson $lesson, int $userId): void
    {
        $sessionId = $request->input('session_id');
        if (empty($sessionId)) {
            return;
        }

        try {
            VideoWatchSession::where('id', (int) $sessionId)
                ->where('user_id', $userId)
                ->where('lesson_id', $lesson->id)
                ->update([
                    'completed' => true,
                    'completed_at' => now(),
                    'ended_at' => now(),
                    'completion_percentage' => 100,
                    'last_event_at' => now(),
                ]);
        } catch (\Throwable $e) {
            Log::warning('Failed to mark optional watch session completed from legacy endpoint: ' . $e->getMessage(), [
                'user_id' => $userId,
                'lesson_id' => $lesson->id,
                'session_id' => $sessionId,
            ]);
        }
    }

    private function hasProgressTrackingColumns(): bool
    {
        static $hasColumns = null;

        if ($hasColumns === null) {
            $hasColumns = Schema::hasColumn('user_lesson_progress', 'progress_percentage')
                && Schema::hasColumn('user_lesson_progress', 'watch_duration_seconds')
                && Schema::hasColumn('user_lesson_progress', 'last_watched_at')
                && Schema::hasColumn('user_lesson_progress', 'first_started_at')
                && Schema::hasColumn('user_lesson_progress', 'completed_by')
                && Schema::hasColumn('user_lesson_progress', 'completion_source')
                && Schema::hasColumn('user_lesson_progress', 'last_position_seconds');
        }

        return $hasColumns;
    }

    private function isVideoTrackingEnabled(): bool
    {
        return (bool) config('video_tracking.enabled', false);
    }

    /**
     * Get navigation info for a lesson: previous/next and whether next is the last lesson
     */
    public function navigation($id)
    {
        $lesson = Lesson::with(['chapter.course'])->find($id);

        if (!$lesson) {
            return response()->json([
                'message' => 'Lesson not found'
            ], 404);
        }

        $user = Auth::user();
        $course = $lesson->chapter->course;

        // تحقق الوصول: تسجيل مباشر أو تسجيل دبلومة نشط
        $hasCourseEnrollment = UserCourse::where('user_id', $user->id)
            ->where('course_id', $course->id)
            ->exists();

        $hasActiveDiplomaEnrollment = false;
        if (!empty($course->category_id)) {
            $hasActiveDiplomaEnrollment = UserCategoryEnrollment::where('user_id', $user->id)
                ->where('category_id', $course->category_id)
                ->where('status', 'active')
                ->exists();
        }

        if (!($hasCourseEnrollment || $hasActiveDiplomaEnrollment)) {
            return response()->json([
                'message' => 'You are not enrolled in this course'
            ], 403);
        }

        // بناء قائمة الدروس مرتبة حسب ترتيب الفصول ثم الدروس للمسجلين في المقرر
        $orderedLessons = Lesson::query()
            ->join('chapters', 'lessons.chapter_id', '=', 'chapters.id')
            ->where('chapters.course_id', $course->id)
            ->orderByRaw('COALESCE(chapters.`order`, chapters.id)')
            ->orderByRaw('COALESCE(lessons.`order`, lessons.id)')
            ->select(['lessons.id'])
            ->get();

        $ids = $orderedLessons->pluck('id');
        $count = $ids->count();
        $currentIndex = $ids->search($lesson->id);

        if ($currentIndex === false) {
            // إذا كان الدرس غير مرئي حاليًا أو غير موجود ضمن القائمة المرئية
            return response()->json([
                'message' => 'Lesson is not available for navigation',
            ], 400);
        }

        $prevLessonId = $currentIndex > 0 ? $ids[$currentIndex - 1] : null;
        $nextLessonId = $currentIndex < ($count - 1) ? $ids[$currentIndex + 1] : null;
        $lastLessonId = $count > 0 ? $ids[$count - 1] : null;

        $isLastLesson = $lesson->id === $lastLessonId;
        $isNextLast = $nextLessonId !== null && $nextLessonId === $lastLessonId;

        return response()->json([
            'message' => 'Navigation fetched successfully',
            'data' => [
                'current_lesson_id' => $lesson->id,
                'prev_lesson_id' => $prevLessonId,
                'next_lesson_id' => $nextLessonId,
                'last_lesson_id' => $lastLessonId,
                'is_last_lesson' => $isLastLesson,
                'is_next_last' => $isNextLast,
                'finish_course_available' => $isNextLast,
            ]
        ]);
    }
}

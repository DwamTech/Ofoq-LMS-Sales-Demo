<?php

namespace App\Services;

use App\Models\BunnyCostSnapshot;
use App\Models\BunnyVideoStat;
use App\Models\CategoryOfCourse;
use App\Models\Course;
use App\Models\Lesson;
use App\Models\User;
use App\Models\UserCategoryEnrollment;
use App\Models\UserCourse;
use App\Models\UserLessonProgress;
use App\Models\VideoWatchEvent;
use App\Models\VideoWatchSession;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;

class EducationalReportService
{
    public function __construct(private DiplomaCompletionService $diplomaCompletion)
    {
    }

    public function overview(array $filters): array
    {
        $limit = $this->limit($filters, 10);

        $watchSessions = $this->watchSessionQuery($filters);
        $progress = $this->lessonProgressQuery($filters);

        return [
            'summary' => [
                'total_students' => User::where('role', '!=', 'admin')->count(),
                'active_students' => $this->activeStudentsCount($filters),
                'inactive_students' => max(0, User::where('role', '!=', 'admin')->count() - $this->activeStudentsCount($filters)),
                'total_diplomas' => CategoryOfCourse::count(),
                'total_courses' => Course::withoutGlobalScope('published')->count(),
                'total_lessons' => Lesson::count(),
                'total_watch_sessions' => (clone $watchSessions)->count(),
                'total_watch_duration_seconds' => (int) (clone $watchSessions)->sum('watched_seconds'),
                'completed_lessons_count' => (clone $progress)->where('status', 'completed')->count(),
            ],
            'top_courses' => $this->topCourses($filters, $limit),
            'top_lessons' => $this->topLessons($filters, $limit),
            'recent_activity' => $this->recentActivity($filters, $limit),
            'estimated_bunny_cost' => $this->costSummary(),
            'availability' => $this->availabilityMarkers(),
        ];
    }

    public function studentReport(User $student, array $filters): array
    {
        $filters = array_merge($filters, ['student_id' => $student->id]);
        $watchSessions = $this->watchSessionQuery($filters);
        $progress = $this->lessonProgressQuery($filters);

        return [
            'student' => $this->studentSummary($student),
            'filters' => $this->publicFilters($filters),
            'diplomas' => $this->studentDiplomas($student, $filters),
            'courses' => $this->studentCourses($student, $filters),
            'activity' => [
                'started_lessons_count' => (clone $progress)->whereIn('status', ['in_progress', 'completed'])->count(),
                'completed_lessons_count' => (clone $progress)->where('status', 'completed')->count(),
                'last_activity_at' => $this->maxDate([
                    (clone $watchSessions)->max('last_event_at'),
                    (clone $progress)->max('last_watched_at'),
                    (clone $progress)->max('updated_at'),
                ]),
                'total_watch_duration_seconds' => (int) (clone $watchSessions)->sum('watched_seconds'),
                'watch_sessions_count' => (clone $watchSessions)->count(),
                'play_events_count' => $this->eventCount($filters, 'play'),
            ],
            'lessons' => $this->paginateLessonProgress($progress, $filters),
            'estimated_bunny_cost' => $this->studentCostSummary($student, $filters),
        ];
    }

    public function lessonReport(Lesson $lesson, array $filters): array
    {
        $lesson->loadMissing('chapter.course.category');
        $filters = array_merge($filters, [
            'lesson_id' => $lesson->id,
            'course_id' => $lesson->chapter?->course_id,
            'category_id' => $lesson->chapter?->course?->category_id,
        ]);

        $watchSessions = $this->watchSessionQuery($filters);
        $progress = $this->lessonProgressQuery($filters);
        $openedStudentIds = (clone $watchSessions)->distinct()->pluck('user_id');
        $completedStudents = (clone $progress)->where('status', 'completed')->distinct('user_id')->count('user_id');
        $enrolledStudentIds = $this->courseEnrolledStudentIds((int) $lesson->chapter?->course_id);

        return [
            'lesson' => $this->lessonSummary($lesson),
            'summary' => [
                'opened_students_count' => $openedStudentIds->count(),
                'completed_students_count' => $completedStudents,
                'enrolled_not_opened_count' => max(0, $enrolledStudentIds->diff($openedStudentIds)->count()),
                'total_watch_duration_seconds' => (int) (clone $watchSessions)->sum('watched_seconds'),
                'average_watch_duration_seconds' => round((float) (clone $watchSessions)->avg('watched_seconds'), 2),
                'watch_sessions_count' => (clone $watchSessions)->count(),
                'completions_count' => (clone $watchSessions)->where('completed', true)->count(),
            ],
            'bunny_video_stats' => $this->bunnyVideoSummaryForLesson($lesson->id),
            'estimated_bunny_cost' => $this->lessonCostSummary($lesson->id),
            'students' => $this->lessonStudentsTable($lesson, $filters),
        ];
    }

    public function courseReport(Course $course, array $filters): array
    {
        $course = Course::withoutGlobalScope('published')->with('category')->findOrFail($course->id);
        $filters = array_merge($filters, ['course_id' => $course->id, 'category_id' => $course->category_id]);
        $watchSessions = $this->watchSessionQuery($filters);
        $progress = $this->lessonProgressQuery($filters);
        $enrollments = UserCourse::where('course_id', $course->id);

        return [
            'course' => $this->courseSummary($course),
            'summary' => [
                'enrolled_students_count' => (clone $enrollments)->distinct('user_id')->count('user_id'),
                'started_students_count' => (clone $watchSessions)->distinct('user_id')->count('user_id'),
                'completed_students_count' => (clone $enrollments)->where('status', 'completed')->distinct('user_id')->count('user_id'),
                'not_started_students_count' => max(0, (clone $enrollments)->distinct('user_id')->count('user_id') - (clone $watchSessions)->distinct('user_id')->count('user_id')),
                'average_completion_percentage' => round((float) (clone $enrollments)->avg('progress_percentage'), 2),
                'total_watch_duration_seconds' => (int) (clone $watchSessions)->sum('watched_seconds'),
                'completed_lessons_count' => (clone $progress)->where('status', 'completed')->count(),
            ],
            'most_watched_lessons' => $this->lessonWatchRanking($filters, 'desc', $this->limit($filters, 10)),
            'least_watched_lessons' => $this->lessonWatchRanking($filters, 'asc', $this->limit($filters, 10)),
            'estimated_bunny_cost' => $this->courseCostSummary($course->id),
            'students' => $this->courseStudentsTable($course, $filters),
            'lessons' => $this->courseLessonsTable($course, $filters),
        ];
    }

    public function diplomaReport(CategoryOfCourse $category, array $filters): array
    {
        $filters = array_merge($filters, ['category_id' => $category->id]);
        $watchSessions = $this->watchSessionQuery($filters);
        $enrollments = UserCategoryEnrollment::where('category_id', $category->id);
        $enrollmentRecords = (clone $enrollments)->get();
        $completionDetails = $this->diplomaCompletion->forEnrollments($enrollmentRecords);
        $startedStudents = (clone $watchSessions)->distinct('user_id')->count('user_id');
        $totalEnrolled = (clone $enrollments)->distinct('user_id')->count('user_id');
        $completedStudents = $enrollmentRecords
            ->filter(fn (UserCategoryEnrollment $enrollment) => (bool) ($completionDetails->get($enrollment->id)['completed'] ?? false))
            ->pluck('user_id')
            ->unique()
            ->count();

        return [
            'diploma' => $this->diplomaSummary($category),
            'summary' => [
                'enrolled_students_count' => $totalEnrolled,
                'started_students_count' => $startedStudents,
                'completed_students_count' => $completedStudents,
                'not_started_students_count' => max(0, $totalEnrolled - $startedStudents),
                'average_completion_percentage' => round((float) $completionDetails->avg('progress_percentage'), 2),
                'total_watch_duration_seconds' => (int) (clone $watchSessions)->sum('watched_seconds'),
            ],
            'estimated_bunny_cost' => $this->diplomaCostSummary($category->id),
            'top_courses' => $this->topCourses($filters, $this->limit($filters, 10)),
            'top_lessons' => $this->topLessons($filters, $this->limit($filters, 10)),
            'students' => $this->diplomaStudentsTable($category, $filters),
            'courses' => $this->diplomaCoursesTable($category, $filters),
        ];
    }

    private function watchSessionQuery(array $filters): Builder
    {
        return VideoWatchSession::query()
            ->when($filters['student_id'] ?? null, fn ($q, $id) => $q->where('user_id', $id))
            ->when($filters['lesson_id'] ?? null, fn ($q, $id) => $q->where('lesson_id', $id))
            ->when($filters['course_id'] ?? null, fn ($q, $id) => $q->where('course_id', $id))
            ->when($this->categoryId($filters), fn ($q, $id) => $q->where('category_id', $id))
            ->when($filters['from'] ?? null, fn ($q, $from) => $q->where('started_at', '>=', $from))
            ->when($filters['to'] ?? null, fn ($q, $to) => $q->where('started_at', '<=', $to));
    }

    private function lessonProgressQuery(array $filters): Builder
    {
        return UserLessonProgress::query()
            ->when($filters['student_id'] ?? null, fn ($q, $id) => $q->where('user_id', $id))
            ->when($filters['lesson_id'] ?? null, fn ($q, $id) => $q->where('lesson_id', $id))
            ->when($filters['status'] ?? null, fn ($q, $status) => in_array($status, ['not_started', 'in_progress', 'completed'], true) ? $q->where('status', $status) : $q)
            ->when($filters['from'] ?? null, fn ($q, $from) => $q->where('updated_at', '>=', $from))
            ->when($filters['to'] ?? null, fn ($q, $to) => $q->where('updated_at', '<=', $to))
            ->when($filters['course_id'] ?? null, function ($q, $courseId) {
                $q->whereHas('lesson.chapter', fn ($nested) => $nested->where('course_id', $courseId));
            })
            ->when($this->categoryId($filters), function ($q, $categoryId) {
                $q->whereHas('lesson.chapter.course', fn ($nested) => $nested->where('category_id', $categoryId));
            });
    }

    private function eventCount(array $filters, string $eventType): int
    {
        return VideoWatchEvent::query()
            ->where('event_type', $eventType)
            ->when($filters['student_id'] ?? null, fn ($q, $id) => $q->where('user_id', $id))
            ->when($filters['lesson_id'] ?? null, fn ($q, $id) => $q->where('lesson_id', $id))
            ->when($filters['from'] ?? null, fn ($q, $from) => $q->where('created_at', '>=', $from))
            ->when($filters['to'] ?? null, fn ($q, $to) => $q->where('created_at', '<=', $to))
            ->when($filters['course_id'] ?? null, function ($q, $courseId) {
                $q->whereHas('lesson.chapter', fn ($nested) => $nested->where('course_id', $courseId));
            })
            ->when($this->categoryId($filters), function ($q, $categoryId) {
                $q->whereHas('lesson.chapter.course', fn ($nested) => $nested->where('category_id', $categoryId));
            })
            ->count();
    }

    private function paginateLessonProgress(Builder $query, array $filters): array
    {
        $paginator = $query->with('lesson:id,title,chapter_id')
            ->orderByDesc('updated_at')
            ->paginate($this->perPage($filters), ['*'], 'lessons_page', (int) ($filters['lessons_page'] ?? 1));

        return $this->paginated($paginator, fn (UserLessonProgress $progress) => [
            'lesson_id' => $progress->lesson_id,
            'lesson_title' => $progress->lesson?->title,
            'status' => $progress->status,
            'progress_percentage' => (float) ($progress->progress_percentage ?? 0),
            'watch_duration_seconds' => (int) ($progress->watch_duration_seconds ?? 0),
            'last_watched_at' => $progress->last_watched_at,
            'completed_at' => $progress->completed_at,
        ]);
    }

    private function lessonStudentsTable(Lesson $lesson, array $filters): array
    {
        $studentIds = $this->courseEnrolledStudentIds((int) $lesson->chapter?->course_id);
        $paginator = User::query()
            ->whereIn('id', $studentIds)
            ->when($filters['status'] ?? null, function ($q, $status) use ($lesson) {
                if ($status === 'not_started') {
                    $q->whereDoesntHave('lessonProgress', fn ($p) => $p->where('lesson_id', $lesson->id));
                } elseif (in_array($status, ['in_progress', 'completed'], true)) {
                    $q->whereHas('lessonProgress', fn ($p) => $p->where('lesson_id', $lesson->id)->where('status', $status));
                }
            })
            ->orderBy('id')
            ->paginate($this->perPage($filters), ['*'], 'students_page', (int) ($filters['students_page'] ?? 1));

        $progressByUser = UserLessonProgress::where('lesson_id', $lesson->id)
            ->whereIn('user_id', $paginator->getCollection()->pluck('id'))
            ->get()
            ->keyBy('user_id');

        $watchByUser = VideoWatchSession::where('lesson_id', $lesson->id)
            ->whereIn('user_id', $paginator->getCollection()->pluck('id'))
            ->select('user_id', DB::raw('SUM(watched_seconds) as watch_duration_seconds'), DB::raw('MAX(last_event_at) as last_watched_at'))
            ->groupBy('user_id')
            ->get()
            ->keyBy('user_id');

        return $this->paginated($paginator, function (User $student) use ($progressByUser, $watchByUser) {
            $progress = $progressByUser->get($student->id);
            $watch = $watchByUser->get($student->id);

            return [
                'student_id' => $student->id,
                'name' => $student->name,
                'status' => $progress?->status ?? 'not_started',
                'progress_percentage' => (float) ($progress?->progress_percentage ?? 0),
                'watch_duration_seconds' => (int) ($watch?->watch_duration_seconds ?? $progress?->watch_duration_seconds ?? 0),
                'last_watched_at' => $watch?->last_watched_at ?? $progress?->last_watched_at,
                'completed_at' => $progress?->completed_at,
            ];
        });
    }

    private function courseStudentsTable(Course $course, array $filters): array
    {
        $query = UserCourse::query()
            ->with('user:id,name,email')
            ->where('course_id', $course->id)
            ->when($filters['status'] ?? null, fn ($q, $status) => in_array($status, ['in_progress', 'completed'], true) ? $q->where('status', $status) : $q)
            ->orderBy('user_id');

        $paginator = $query->paginate($this->perPage($filters), ['*'], 'students_page', (int) ($filters['students_page'] ?? 1));

        $watchByUser = VideoWatchSession::where('course_id', $course->id)
            ->whereIn('user_id', $paginator->getCollection()->pluck('user_id'))
            ->select('user_id', DB::raw('SUM(watched_seconds) as watch_duration_seconds'), DB::raw('MAX(last_event_at) as last_watched_at'))
            ->groupBy('user_id')
            ->get()
            ->keyBy('user_id');

        return $this->paginated($paginator, function (UserCourse $enrollment) use ($watchByUser) {
            $watch = $watchByUser->get($enrollment->user_id);

            return [
                'student_id' => $enrollment->user_id,
                'name' => $enrollment->user?->name,
                'email' => $enrollment->user?->email,
                'status' => $enrollment->status,
                'progress_percentage' => (float) ($enrollment->progress_percentage ?? 0),
                'watch_duration_seconds' => (int) ($watch?->watch_duration_seconds ?? 0),
                'last_watched_at' => $watch?->last_watched_at,
                'completed_at' => $enrollment->completed_at,
            ];
        });
    }

    private function diplomaStudentsTable(CategoryOfCourse $category, array $filters): array
    {
        $query = UserCategoryEnrollment::query()
            ->with('user:id,name,email')
            ->where('category_id', $category->id)
            ->when($filters['status'] ?? null, fn ($q, $status) => in_array($status, ['active', 'completed', 'pending'], true) ? $q->where('status', $status) : $q)
            ->orderBy('user_id');

        $paginator = $query->paginate($this->perPage($filters), ['*'], 'students_page', (int) ($filters['students_page'] ?? 1));

        $watchByUser = VideoWatchSession::where('category_id', $category->id)
            ->whereIn('user_id', $paginator->getCollection()->pluck('user_id'))
            ->select('user_id', DB::raw('SUM(watched_seconds) as watch_duration_seconds'), DB::raw('MAX(last_event_at) as last_watched_at'))
            ->groupBy('user_id')
            ->get()
            ->keyBy('user_id');

        $completionDetails = $this->diplomaCompletion->forEnrollments($paginator->getCollection());

        return $this->paginated($paginator, function (UserCategoryEnrollment $enrollment) use ($category, $watchByUser, $completionDetails) {
            $watch = $watchByUser->get($enrollment->user_id);
            $completion = $completionDetails->get($enrollment->id) ?? [];
            $isCompleted = (bool) ($completion['completed'] ?? false);

            return [
                'student_id' => $enrollment->user_id,
                'name' => $enrollment->user?->name,
                'email' => $enrollment->user?->email,
                'status' => $isCompleted ? 'completed' : $enrollment->status,
                'progress_percentage' => (float) ($completion['progress_percentage'] ?? 0),
                'watch_duration_seconds' => (int) ($watch?->watch_duration_seconds ?? 0),
                'last_watched_at' => $watch?->last_watched_at,
                'completed_at' => $completion['completed_at'] ?? $enrollment->completed_at,
            ];
        });
    }

    private function courseLessonsTable(Course $course, array $filters): array
    {
        $paginator = Lesson::query()
            ->with('chapter:id,course_id,title')
            ->whereHas('chapter', fn ($q) => $q->where('course_id', $course->id))
            ->orderBy('chapter_id')
            ->orderBy('order')
            ->paginate($this->perPage($filters), ['*'], 'lessons_page', (int) ($filters['lessons_page'] ?? 1));

        return $this->paginated($paginator, fn (Lesson $lesson) => $this->lessonAggregateSummary($lesson));
    }

    private function diplomaCoursesTable(CategoryOfCourse $category, array $filters): array
    {
        $paginator = Course::withoutGlobalScope('published')
            ->where('category_id', $category->id)
            ->orderBy('id')
            ->paginate($this->perPage($filters), ['*'], 'courses_page', (int) ($filters['courses_page'] ?? 1));

        return $this->paginated($paginator, fn (Course $course) => $this->courseAggregateSummary($course));
    }

    private function topCourses(array $filters, int $limit): array
    {
        return VideoWatchSession::query()
            ->select('course_id', DB::raw('SUM(watched_seconds) as watch_duration_seconds'), DB::raw('COUNT(*) as sessions_count'))
            ->whereNotNull('course_id')
            ->when($this->categoryId($filters), fn ($q, $id) => $q->where('category_id', $id))
            ->when($filters['from'] ?? null, fn ($q, $from) => $q->where('started_at', '>=', $from))
            ->when($filters['to'] ?? null, fn ($q, $to) => $q->where('started_at', '<=', $to))
            ->groupBy('course_id')
            ->orderByDesc('watch_duration_seconds')
            ->limit($limit)
            ->get()
            ->map(function ($row) {
                $course = Course::withoutGlobalScope('published')->find($row->course_id);
                return [
                    'course_id' => $row->course_id,
                    'course_title' => $course?->title,
                    'watch_duration_seconds' => (int) $row->watch_duration_seconds,
                    'sessions_count' => (int) $row->sessions_count,
                ];
            })
            ->values()
            ->all();
    }

    private function topLessons(array $filters, int $limit): array
    {
        return $this->lessonWatchRanking($filters, 'desc', $limit);
    }

    private function lessonWatchRanking(array $filters, string $direction, int $limit): array
    {
        $rows = VideoWatchSession::query()
            ->select('lesson_id', DB::raw('SUM(watched_seconds) as watch_duration_seconds'), DB::raw('COUNT(*) as sessions_count'))
            ->when($filters['course_id'] ?? null, fn ($q, $id) => $q->where('course_id', $id))
            ->when($this->categoryId($filters), fn ($q, $id) => $q->where('category_id', $id))
            ->when($filters['from'] ?? null, fn ($q, $from) => $q->where('started_at', '>=', $from))
            ->when($filters['to'] ?? null, fn ($q, $to) => $q->where('started_at', '<=', $to))
            ->groupBy('lesson_id')
            ->orderBy('watch_duration_seconds', $direction)
            ->limit($limit)
            ->get();

        $lessons = Lesson::whereIn('id', $rows->pluck('lesson_id'))->get()->keyBy('id');

        return $rows->map(fn ($row) => [
            'lesson_id' => $row->lesson_id,
            'lesson_title' => $lessons->get($row->lesson_id)?->title,
            'watch_duration_seconds' => (int) $row->watch_duration_seconds,
            'sessions_count' => (int) $row->sessions_count,
        ])->values()->all();
    }

    private function recentActivity(array $filters, int $limit): array
    {
        return $this->watchSessionQuery($filters)
            ->with(['user:id,name', 'lesson:id,title'])
            ->orderByDesc('last_event_at')
            ->limit($limit)
            ->get()
            ->map(fn (VideoWatchSession $session) => [
                'student_id' => $session->user_id,
                'student_name' => $session->user?->name,
                'lesson_id' => $session->lesson_id,
                'lesson_title' => $session->lesson?->title,
                'course_id' => $session->course_id,
                'category_id' => $session->category_id,
                'watched_seconds' => $session->watched_seconds,
                'last_event_at' => $session->last_event_at,
            ])
            ->all();
    }

    private function studentDiplomas(User $student, array $filters): array
    {
        $enrollments = UserCategoryEnrollment::with('category:id,name,slug')
            ->where('user_id', $student->id)
            ->when($this->categoryId($filters), fn ($q, $id) => $q->where('category_id', $id))
            ->get();
        $completion = $this->diplomaCompletion->forEnrollments($enrollments);

        return $enrollments->map(fn (UserCategoryEnrollment $enrollment) => [
                'category_id' => $enrollment->category_id,
                'name' => $enrollment->category?->name,
                'slug' => $enrollment->category?->slug,
                'status' => $enrollment->status,
                'progress_percentage' => $completion->get($enrollment->id)['progress_percentage'] ?? 0,
                'enrolled_at' => $enrollment->created_at,
                'completed_at' => $completion->get($enrollment->id)['completed_at'] ?? null,
            ])
            ->all();
    }

    private function studentCourses(User $student, array $filters): array
    {
        return UserCourse::with('course:id,title,category_id')
            ->where('user_id', $student->id)
            ->when($filters['course_id'] ?? null, fn ($q, $id) => $q->where('course_id', $id))
            ->when($this->categoryId($filters), function ($q, $id) {
                $q->whereHas('course', fn ($course) => $course->where('category_id', $id));
            })
            ->get()
            ->map(fn (UserCourse $enrollment) => [
                'course_id' => $enrollment->course_id,
                'title' => $enrollment->course?->title,
                'category_id' => $enrollment->course?->category_id,
                'status' => $enrollment->status,
                'progress_percentage' => (float) ($enrollment->progress_percentage ?? 0),
                'completed_at' => $enrollment->completed_at,
            ])
            ->all();
    }

    private function lessonAggregateSummary(Lesson $lesson): array
    {
        $watch = VideoWatchSession::where('lesson_id', $lesson->id);
        return [
            'lesson_id' => $lesson->id,
            'lesson_title' => $lesson->title,
            'chapter_id' => $lesson->chapter_id,
            'watch_sessions_count' => (clone $watch)->count(),
            'watch_duration_seconds' => (int) (clone $watch)->sum('watched_seconds'),
            'completed_students_count' => UserLessonProgress::where('lesson_id', $lesson->id)->where('status', 'completed')->distinct('user_id')->count('user_id'),
            'bunny_video_stats' => $this->bunnyVideoSummaryForLesson($lesson->id),
        ];
    }

    private function courseAggregateSummary(Course $course): array
    {
        $watch = VideoWatchSession::where('course_id', $course->id);
        return [
            'course_id' => $course->id,
            'course_title' => $course->title,
            'enrolled_students_count' => UserCourse::where('course_id', $course->id)->distinct('user_id')->count('user_id'),
            'watch_duration_seconds' => (int) (clone $watch)->sum('watched_seconds'),
            'watch_sessions_count' => (clone $watch)->count(),
            'average_completion_percentage' => round((float) UserCourse::where('course_id', $course->id)->avg('progress_percentage'), 2),
        ];
    }

    private function bunnyVideoSummaryForLesson(int $lessonId): ?array
    {
        $stat = BunnyVideoStat::where('lesson_id', $lessonId)->first();
        if (!$stat) {
            return null;
        }

        return [
            'video_guid' => $stat->video_guid,
            'title' => $stat->title,
            'status' => $stat->status_label,
            'duration_seconds' => $stat->duration_seconds,
            'storage_size_bytes' => $stat->storage_size_bytes,
            'views' => $stat->views,
            'average_watch_time_seconds' => $stat->average_watch_time_seconds,
            'total_watch_time_seconds' => $stat->total_watch_time_seconds,
            'thumbnail_url' => $stat->thumbnail_url,
            'last_synced_at' => $stat->last_synced_at,
            'data_source' => $stat->data_source,
            'accuracy_level' => $stat->accuracy_level,
        ];
    }

    private function studentCostSummary(User $student, array $filters): array
    {
        $latest = BunnyCostSnapshot::latest('id')->first();
        if (!$latest || !in_array($latest->cost_status, ['estimated', 'estimated_partial'], true)) {
            return $this->unavailableCost('No estimated Bunny cost snapshot is available.');
        }

        $totalWatch = VideoWatchSession::sum('watched_seconds');
        $studentWatch = (clone $this->watchSessionQuery($filters))->where('user_id', $student->id)->sum('watched_seconds');

        if ($totalWatch <= 0 || $studentWatch <= 0) {
            return $this->unavailableCost('Insufficient watch duration data for student allocation.');
        }

        return $this->estimatedCost((float) $latest->total_estimated_cost * ($studentWatch / $totalWatch), $latest, 'watch_duration_share');
    }

    private function lessonCostSummary(int $lessonId): array
    {
        $stat = BunnyVideoStat::where('lesson_id', $lessonId)->first();
        return $this->storageShareCost($stat?->storage_size_bytes, 'lesson_storage_share');
    }

    private function courseCostSummary(int $courseId): array
    {
        $storage = BunnyVideoStat::whereHas('lesson.chapter', fn ($q) => $q->where('course_id', $courseId))->sum('storage_size_bytes');
        return $this->storageShareCost($storage ?: null, 'course_storage_share');
    }

    private function diplomaCostSummary(int $categoryId): array
    {
        $storage = BunnyVideoStat::whereHas('lesson.chapter.course', fn ($q) => $q->where('category_id', $categoryId))->sum('storage_size_bytes');
        return $this->storageShareCost($storage ?: null, 'diploma_storage_share');
    }

    private function storageShareCost(?int $storageBytes, string $basis): array
    {
        $latest = BunnyCostSnapshot::latest('id')->first();
        $totalStorage = BunnyVideoStat::sum('storage_size_bytes');

        if (!$latest || !$storageBytes || $totalStorage <= 0 || $latest->storage_cost === null) {
            return $this->unavailableCost('Insufficient Bunny storage cost data for allocation.');
        }

        return $this->estimatedCost((float) $latest->storage_cost * ($storageBytes / $totalStorage), $latest, $basis, 'estimated_partial');
    }

    private function costSummary(): array
    {
        $latest = BunnyCostSnapshot::latest('id')->first();
        if (!$latest) {
            return $this->unavailableCost('No Bunny cost snapshot is available.');
        }

        return [
            'status' => in_array($latest->cost_status, ['estimated', 'estimated_partial'], true) ? $latest->cost_status : 'unavailable',
            'amount' => in_array($latest->cost_status, ['estimated', 'estimated_partial'], true) ? (float) $latest->total_estimated_cost : null,
            'currency' => $latest->currency,
            'period_start' => $latest->period_start,
            'period_end' => $latest->period_end,
            'accuracy_level' => 'estimated',
            'availability' => $latest->cost_status,
        ];
    }

    private function estimatedCost(float $amount, BunnyCostSnapshot $snapshot, string $basis, string $status = 'estimated'): array
    {
        return [
            'status' => $status,
            'amount' => round($amount, 6),
            'currency' => $snapshot->currency,
            'basis' => $basis,
            'accuracy_level' => 'estimated',
            'availability' => $snapshot->cost_status,
        ];
    }

    private function unavailableCost(string $reason): array
    {
        return [
            'status' => 'unavailable',
            'amount' => null,
            'currency' => null,
            'reason' => $reason,
            'accuracy_level' => 'unavailable',
        ];
    }

    private function averageDiplomaCompletion(CategoryOfCourse $category): float
    {
        $enrollments = UserCategoryEnrollment::where('category_id', $category->id)->pluck('user_id');
        if ($enrollments->isEmpty()) {
            return 0.0;
        }

        return round((float) $enrollments->map(fn ($userId) => $this->diplomaCompletionForUser((int) $userId, $category->id))->avg(), 2);
    }

    private function diplomaCompletionForUser(int $userId, int $categoryId): float
    {
        $courseIds = Course::withoutGlobalScope('published')->where('category_id', $categoryId)->pluck('id');
        if ($courseIds->isEmpty()) {
            return 0.0;
        }

        $avg = UserCourse::where('user_id', $userId)
            ->whereIn('course_id', $courseIds)
            ->avg('progress_percentage');

        return round((float) ($avg ?? 0), 2);
    }

    private function activeStudentsCount(array $filters): int
    {
        return $this->watchSessionQuery($filters)->distinct('user_id')->count('user_id');
    }

    private function courseEnrolledStudentIds(int $courseId): \Illuminate\Support\Collection
    {
        if (!$courseId) {
            return collect();
        }

        $direct = UserCourse::where('course_id', $courseId)->pluck('user_id');
        $categoryId = Course::withoutGlobalScope('published')->where('id', $courseId)->value('category_id');
        $diploma = $categoryId ? UserCategoryEnrollment::where('category_id', $categoryId)->where('status', 'active')->pluck('user_id') : collect();

        return $direct->merge($diploma)->unique()->values();
    }

    private function studentSummary(User $student): array
    {
        return [
            'id' => $student->id,
            'name' => $student->name,
            'email' => $student->email,
            'phone' => $student->phone,
            'nationality' => $student->nationality,
            'qualification' => $student->qualification,
            'created_at' => $student->created_at,
        ];
    }

    private function lessonSummary(Lesson $lesson): array
    {
        return [
            'id' => $lesson->id,
            'title' => $lesson->title,
            'chapter_id' => $lesson->chapter_id,
            'chapter_title' => $lesson->chapter?->title,
            'course_id' => $lesson->chapter?->course_id,
            'course_title' => $lesson->chapter?->course?->title,
            'category_id' => $lesson->chapter?->course?->category_id,
            'category_name' => $lesson->chapter?->course?->category?->name,
            'video_guid' => $lesson->video_guid,
            'video_status' => $lesson->video_status,
        ];
    }

    private function courseSummary(Course $course): array
    {
        return [
            'id' => $course->id,
            'title' => $course->title,
            'category_id' => $course->category_id,
            'category_name' => $course->category?->name,
            'is_published' => (bool) $course->is_published,
            'total_views' => $course->total_views,
        ];
    }

    private function diplomaSummary(CategoryOfCourse $category): array
    {
        return [
            'id' => $category->id,
            'name' => $category->name,
            'slug' => $category->slug,
            'is_published' => (bool) $category->is_published,
            'total_views' => $category->total_views,
        ];
    }

    private function paginated(LengthAwarePaginator $paginator, callable $map): array
    {
        return [
            'data' => $paginator->getCollection()->map($map)->values(),
            'pagination' => [
                'current_page' => $paginator->currentPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'last_page' => $paginator->lastPage(),
            ],
        ];
    }

    private function categoryId(array $filters): ?int
    {
        return isset($filters['category_id']) ? (int) $filters['category_id'] : (isset($filters['diploma_id']) ? (int) $filters['diploma_id'] : null);
    }

    private function perPage(array $filters): int
    {
        return max(1, min((int) ($filters['per_page'] ?? 25), 100));
    }

    private function limit(array $filters, int $default): int
    {
        return max(1, min((int) ($filters['limit'] ?? $default), 50));
    }

    private function publicFilters(array $filters): array
    {
        return array_intersect_key($filters, array_flip(['from', 'to', 'category_id', 'diploma_id', 'course_id', 'status', 'per_page']));
    }

    private function maxDate(array $dates): mixed
    {
        return collect($dates)->filter()->sortDesc()->first();
    }

    private function availabilityMarkers(): array
    {
        return [
            'exact' => ['lesson_progress', 'watch_sessions', 'bunny_video_stats_when_synced'],
            'estimated' => ['bunny_cost_allocations'],
            'unavailable' => ['raw_event_timelines', 'exact_student_cost', 'exact_course_cost', 'exact_diploma_cost'],
        ];
    }
}

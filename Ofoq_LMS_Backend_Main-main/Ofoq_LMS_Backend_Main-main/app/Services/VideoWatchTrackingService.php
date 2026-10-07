<?php

namespace App\Services;

use App\Models\CategoryOfCourse;
use App\Models\Course;
use App\Models\Lesson;
use App\Models\User;
use App\Models\UserCategoryEnrollment;
use App\Models\UserCourse;
use App\Models\UserLessonProgress;
use App\Models\VideoWatchEvent;
use App\Models\VideoWatchSession;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class VideoWatchTrackingService
{
    public function isEnabled(): bool
    {
        return (bool) config('video_tracking.enabled', false);
    }

    public function heartbeatSeconds(): int
    {
        return max(5, (int) config('video_tracking.heartbeat_seconds', 20));
    }

    public function userCanAccessLesson(User $user, Lesson $lesson): bool
    {
        $lesson->loadMissing(['chapter.course']);
        $course = $lesson->chapter?->course;

        if (!$course) {
            return false;
        }

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

        return $hasCourseEnrollment || $hasActiveDiplomaEnrollment;
    }

    public function startSession(User $user, Lesson $lesson, array $data, Request $request): VideoWatchSession
    {
        $lesson->loadMissing(['chapter.course']);
        $course = $lesson->chapter?->course;

        $session = VideoWatchSession::create([
            'user_id' => $user->id,
            'lesson_id' => $lesson->id,
            'course_id' => $course?->id,
            'category_id' => $course?->category_id,
            'video_guid' => $data['video_guid'] ?? $lesson->video_guid,
            'started_at' => now(),
            'last_event_at' => now(),
            'duration_seconds' => $this->sanitizeSeconds($data['duration_seconds'] ?? 0),
            'max_position_seconds' => $this->sanitizeSeconds($data['position_seconds'] ?? 0),
            'completion_percentage' => $this->calculateCompletionPercentage(
                $this->sanitizeSeconds($data['position_seconds'] ?? 0),
                $this->sanitizeSeconds($data['duration_seconds'] ?? 0)
            ),
            'ip_address' => $request->ip(),
            'user_agent' => substr((string) $request->userAgent(), 0, 2000),
            'device_id' => $data['device_id'] ?? null,
        ]);

        $this->ensureProgressStarted($user, $lesson, $session->max_position_seconds);

        VideoWatchEvent::create([
            'video_watch_session_id' => $session->id,
            'user_id' => $user->id,
            'lesson_id' => $lesson->id,
            'event_type' => 'started',
            'position_seconds' => $session->max_position_seconds,
            'duration_seconds' => $session->duration_seconds ?: null,
            'created_at' => now(),
        ]);

        return $session;
    }

    public function recordEvent(VideoWatchSession $session, array $data): VideoWatchSession
    {
        return DB::transaction(function () use ($session, $data) {
            /** @var VideoWatchSession $locked */
            $locked = VideoWatchSession::whereKey($session->id)->lockForUpdate()->firstOrFail();
            $eventType = $data['event_type'];
            $positionSeconds = $this->sanitizeSeconds($data['position_seconds'] ?? 0);
            $durationSeconds = $this->sanitizeSeconds($data['duration_seconds'] ?? $locked->duration_seconds);
            $watchedDelta = $this->calculateWatchedDelta($locked, $eventType, $data);

            VideoWatchEvent::create([
                'video_watch_session_id' => $locked->id,
                'user_id' => $locked->user_id,
                'lesson_id' => $locked->lesson_id,
                'event_type' => $eventType,
                'position_seconds' => $positionSeconds,
                'duration_seconds' => $durationSeconds ?: null,
                'watched_delta_seconds' => $watchedDelta,
                'playback_rate' => isset($data['playback_rate']) ? min((float) $data['playback_rate'], 4.0) : null,
                'metadata' => $data['metadata'] ?? null,
                'created_at' => now(),
            ]);

            $this->applySessionUpdate($locked, $positionSeconds, $durationSeconds, $watchedDelta, $eventType);

            return $locked->refresh();
        });
    }

    public function recordHeartbeat(VideoWatchSession $session, array $data): VideoWatchSession
    {
        return DB::transaction(function () use ($session, $data) {
            /** @var VideoWatchSession $locked */
            $locked = VideoWatchSession::whereKey($session->id)->lockForUpdate()->firstOrFail();
            $positionSeconds = $this->sanitizeSeconds($data['position_seconds'] ?? 0);
            $durationSeconds = $this->sanitizeSeconds($data['duration_seconds'] ?? $locked->duration_seconds);
            $deltaData = [
                'watched_delta_seconds' => !empty($data['is_playing']) ? ($data['watched_delta_seconds'] ?? null) : 0,
            ];
            $watchedDelta = $this->calculateWatchedDelta($locked, 'heartbeat', $deltaData);

            $this->applySessionUpdate($locked, $positionSeconds, $durationSeconds, $watchedDelta, 'heartbeat');

            return $locked->refresh();
        });
    }

    public function markManualCompletion(User $user, Lesson $lesson, ?int $sessionId = null, string $source = 'manual'): ?UserLessonProgress
    {
        try {
            $progress = UserLessonProgress::where('user_id', $user->id)
                ->where('lesson_id', $lesson->id)
                ->first();

            $isFirstCompletion = !$progress || $progress->status !== 'completed';

            $progress = UserLessonProgress::updateOrCreate(
                [
                    'user_id' => $user->id,
                    'lesson_id' => $lesson->id,
                ],
                [
                    'status' => 'completed',
                    'completed_at' => now(),
                    'started_at' => $progress?->started_at ?? now(),
                    'first_started_at' => $progress?->first_started_at ?? $progress?->started_at ?? now(),
                    'last_watched_at' => now(),
                    'progress_percentage' => 100,
                    'completed_by' => $sessionId ? 'watch_session:' . $sessionId : 'manual',
                    'completion_source' => $source,
                ]
            );

            if ($isFirstCompletion) {
                $this->incrementCompletionCounters($lesson);
            }

            $lesson->loadMissing('chapter.course');
            if ($lesson->chapter?->course) {
                $this->updateCourseProgress($user->id, $lesson->chapter->course->id);
            }

            return $progress;
        } catch (\Throwable $e) {
            Log::warning('Manual lesson completion tracking metadata failed: ' . $e->getMessage(), [
                'user_id' => $user->id,
                'lesson_id' => $lesson->id,
            ]);

            return null;
        }
    }

    public function updateCourseProgress(int $userId, int $courseId): void
    {
        $totalLessons = Lesson::whereHas('chapter', function ($query) use ($courseId) {
            $query->where('course_id', $courseId);
        })->count();

        $completedLessons = UserLessonProgress::where('user_id', $userId)
            ->where('status', 'completed')
            ->whereHas('lesson.chapter', function ($query) use ($courseId) {
                $query->where('course_id', $courseId);
            })
            ->count();

        $progressPercentage = $totalLessons > 0 ? round(($completedLessons / $totalLessons) * 100, 2) : 0;
        $userCourse = UserCourse::where('user_id', $userId)
            ->where('course_id', $courseId)
            ->first();

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
            $userCourse->update([
                'progress_percentage' => $progressPercentage,
                'status' => $progressPercentage >= 100 ? 'completed' : 'in_progress',
                'completed_at' => $progressPercentage >= 100 ? now() : null,
            ]);
        }
    }

    private function ensureProgressStarted(User $user, Lesson $lesson, int $positionSeconds): void
    {
        $progress = UserLessonProgress::firstOrCreate(
            [
                'user_id' => $user->id,
                'lesson_id' => $lesson->id,
            ],
            [
                'status' => 'in_progress',
                'started_at' => now(),
                'first_started_at' => now(),
            ]
        );

        $updates = [
            'last_watched_at' => now(),
            'last_position_seconds' => max((int) ($progress->last_position_seconds ?? 0), $positionSeconds),
        ];

        if ($progress->status === 'not_started') {
            $updates['status'] = 'in_progress';
            $updates['started_at'] = now();
        }

        if (empty($progress->first_started_at)) {
            $updates['first_started_at'] = $progress->started_at ?? now();
        }

        $progress->update($updates);
    }

    private function applySessionUpdate(VideoWatchSession $session, int $positionSeconds, int $durationSeconds, int $watchedDelta, string $eventType): void
    {
        $maxPosition = max((int) $session->max_position_seconds, $positionSeconds);
        $duration = $durationSeconds > 0 ? $durationSeconds : (int) $session->duration_seconds;
        $completion = $this->calculateCompletionPercentage($maxPosition, $duration);
        $watchedSeconds = (int) $session->watched_seconds + $watchedDelta;
        $completed = (bool) $session->completed;
        $completedAt = $session->completed_at;

        if ($this->isCompletionEligible($eventType, $completion, $duration, $watchedSeconds)) {
            $completed = true;
            $completedAt = $completedAt ?? now();
        }

        $session->update([
            'last_event_at' => now(),
            'duration_seconds' => $duration,
            'watched_seconds' => $watchedSeconds,
            'max_position_seconds' => $maxPosition,
            'completion_percentage' => $completion,
            'completed' => $completed,
            'completed_at' => $completedAt,
            'ended_at' => $completed ? ($session->ended_at ?? now()) : $session->ended_at,
        ]);

        $this->updateLessonProgress($session, $completed, $watchedDelta);
    }

    private function updateLessonProgress(VideoWatchSession $session, bool $completed, int $watchedDelta): void
    {
        $progress = UserLessonProgress::firstOrCreate(
            [
                'user_id' => $session->user_id,
                'lesson_id' => $session->lesson_id,
            ],
            [
                'status' => 'in_progress',
                'started_at' => $session->started_at ?? now(),
                'first_started_at' => $session->started_at ?? now(),
            ]
        );

        $wasCompleted = $progress->status === 'completed';
        $updates = [
            'last_watched_at' => now(),
            'first_started_at' => $progress->first_started_at ?? $progress->started_at ?? $session->started_at ?? now(),
            'progress_percentage' => max((float) ($progress->progress_percentage ?? 0), (float) $session->completion_percentage),
            'watch_duration_seconds' => max((int) ($progress->watch_duration_seconds ?? 0), 0) + max(0, $watchedDelta),
            'last_position_seconds' => max((int) ($progress->last_position_seconds ?? 0), (int) $session->max_position_seconds),
        ];

        if ($progress->status === 'not_started') {
            $updates['status'] = 'in_progress';
            $updates['started_at'] = now();
        }

        if ($completed) {
            $updates['status'] = 'completed';
            $updates['completed_at'] = $progress->completed_at ?? now();
            $updates['progress_percentage'] = 100;
            $updates['completed_by'] = 'watch_session:' . $session->id;
            $updates['completion_source'] = 'tracking';
        }

        $progress->update($updates);

        if ($completed && !$wasCompleted) {
            $lesson = Lesson::with('chapter.course')->find($session->lesson_id);
            if ($lesson) {
                $this->incrementCompletionCounters($lesson);
                if ($lesson->chapter?->course) {
                    $this->updateCourseProgress($session->user_id, $lesson->chapter->course->id);
                }
            }
        }
    }

    private function incrementCompletionCounters(Lesson $lesson): void
    {
        $lesson->loadMissing('chapter.course');
        $lesson->increment('views');
        $course = $lesson->chapter?->course;

        if ($course) {
            $course->increment('total_views');
            if (!empty($course->category_id)) {
                CategoryOfCourse::where('id', $course->category_id)->increment('total_views');
            }
        }
    }

    private function calculateWatchedDelta(VideoWatchSession $session, string $eventType, array $data): int
    {
        if (in_array($eventType, ['seek', 'play', 'started', 'resumed'], true)) {
            return 0;
        }

        if (($data['watched_delta_seconds'] ?? null) === 0) {
            return 0;
        }

        $maxDelta = max(1, (int) config('video_tracking.max_delta_seconds', 30));
        $serverDelta = $session->last_event_at
            ? max(0, (int) $session->last_event_at->diffInSeconds(now(), true))
            : $maxDelta;
        $clientDelta = isset($data['watched_delta_seconds'])
            ? $this->sanitizeSeconds($data['watched_delta_seconds'])
            : $serverDelta;

        return min($maxDelta, $serverDelta, $clientDelta);
    }

    private function calculateCompletionPercentage(int $positionSeconds, int $durationSeconds): float
    {
        if ($durationSeconds <= 0) {
            return 0;
        }

        return min(100, round(($positionSeconds / $durationSeconds) * 100, 2));
    }

    private function isCompletionEligible(string $eventType, float $completion, int $durationSeconds, int $watchedSeconds): bool
    {
        if ($eventType === 'seek') {
            return false;
        }

        $threshold = $this->completionThreshold();

        if ($completion < $threshold) {
            return false;
        }

        if ($durationSeconds <= 0) {
            return false;
        }

        $requiredWatchSeconds = (int) ceil($durationSeconds * ($threshold / 100));

        return $watchedSeconds >= $requiredWatchSeconds;
    }

    private function completionThreshold(): float
    {
        $threshold = (float) config('video_tracking.completion_threshold', 85);
        return min(100, max(1, $threshold));
    }

    private function sanitizeSeconds(mixed $value): int
    {
        return max(0, min(86400, (int) round((float) ($value ?? 0))));
    }
}

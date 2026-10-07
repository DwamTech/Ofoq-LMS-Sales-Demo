<?php

namespace App\Http\Controllers;

use App\Models\Lesson;
use App\Models\UserLessonProgress;
use App\Models\VideoWatchEvent;
use App\Models\VideoWatchSession;
use App\Services\VideoWatchTrackingService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class VideoWatchTrackingController extends Controller
{
    public function start(Request $request, Lesson $lesson, VideoWatchTrackingService $tracking)
    {
        $user = $request->user();

        if (!$tracking->userCanAccessLesson($user, $lesson)) {
            return response()->json([
                'message' => 'You are not enrolled in this course',
            ], 403);
        }

        $data = $request->validate([
            'video_guid' => ['nullable', 'string', 'max:255'],
            'duration_seconds' => ['nullable', 'numeric', 'min:0', 'max:86400'],
            'position_seconds' => ['nullable', 'numeric', 'min:0', 'max:86400'],
            'device_id' => ['nullable', 'string', 'max:255'],
        ]);

        if (!empty($data['video_guid']) && !empty($lesson->video_guid) && $data['video_guid'] !== $lesson->video_guid) {
            return response()->json([
                'message' => 'Video does not match this lesson',
            ], 422);
        }

        if (!$tracking->isEnabled()) {
            return response()->json($this->disabledStartPayload($lesson->id, $user->id, $tracking));
        }

        $session = $tracking->startSession($user, $lesson, $data, $request);
        $progress = $this->lessonProgress($lesson->id, $user->id);

        return response()->json([
            'session_id' => $session->id,
            'current_progress' => $this->currentProgressPayload($progress),
            'heartbeat_interval' => $tracking->heartbeatSeconds(),
            'completed' => (bool) ($progress?->status === 'completed' || $session->completed),
            'last_position_seconds' => (int) ($progress?->last_position_seconds ?? $session->max_position_seconds ?? 0),
        ]);
    }

    public function recordEvent(Request $request, VideoWatchSession $session, VideoWatchTrackingService $tracking)
    {
        if ((int) $session->user_id !== (int) $request->user()->id) {
            return response()->json([
                'message' => 'Watch session not found',
            ], 404);
        }

        $data = $request->validate([
            'event_type' => ['required', 'string', Rule::in(VideoWatchEvent::TYPES)],
            'position_seconds' => ['required', 'numeric', 'min:0', 'max:86400'],
            'duration_seconds' => ['nullable', 'numeric', 'min:0', 'max:86400'],
            'watched_delta_seconds' => ['nullable', 'numeric', 'min:0', 'max:300'],
            'playback_rate' => ['nullable', 'numeric', 'min:0.25', 'max:4'],
            'metadata' => ['nullable', 'array'],
        ]);

        if (!$tracking->isEnabled()) {
            return response()->json([
                'accepted' => false,
                'tracking_enabled' => false,
                'progress_percentage' => (float) $session->completion_percentage,
                'watched_seconds' => (int) $session->watched_seconds,
                'completed' => (bool) $session->completed,
            ]);
        }

        $session = $tracking->recordEvent($session, $data);

        return response()->json([
            'accepted' => true,
            'progress_percentage' => (float) $session->completion_percentage,
            'watched_seconds' => (int) $session->watched_seconds,
            'completed' => (bool) $session->completed,
        ]);
    }

    public function heartbeat(Request $request, VideoWatchSession $session, VideoWatchTrackingService $tracking)
    {
        if ((int) $session->user_id !== (int) $request->user()->id) {
            return response()->json([
                'message' => 'Watch session not found',
            ], 404);
        }

        $data = $request->validate([
            'position_seconds' => ['required', 'numeric', 'min:0', 'max:86400'],
            'is_playing' => ['required', 'boolean'],
            'duration_seconds' => ['nullable', 'numeric', 'min:0', 'max:86400'],
        ]);

        if (!$tracking->isEnabled()) {
            return response()->json([
                'tracking_enabled' => false,
                'progress_percentage' => (float) $session->completion_percentage,
                'watched_seconds' => (int) $session->watched_seconds,
                'completed' => (bool) $session->completed,
                'next_heartbeat_after' => $tracking->heartbeatSeconds(),
            ]);
        }

        $session = $tracking->recordHeartbeat($session, $data);

        return response()->json([
            'progress_percentage' => (float) $session->completion_percentage,
            'watched_seconds' => (int) $session->watched_seconds,
            'completed' => (bool) $session->completed,
            'next_heartbeat_after' => $tracking->heartbeatSeconds(),
        ]);
    }

    private function disabledStartPayload(int $lessonId, int $userId, VideoWatchTrackingService $tracking): array
    {
        $progress = $this->lessonProgress($lessonId, $userId);

        return [
            'tracking_enabled' => false,
            'session_id' => null,
            'current_progress' => $this->currentProgressPayload($progress),
            'heartbeat_interval' => $tracking->heartbeatSeconds(),
            'completed' => $progress?->status === 'completed',
            'last_position_seconds' => (int) ($progress?->last_position_seconds ?? 0),
        ];
    }

    private function lessonProgress(int $lessonId, int $userId): ?UserLessonProgress
    {
        return UserLessonProgress::where('user_id', $userId)
            ->where('lesson_id', $lessonId)
            ->first();
    }

    private function currentProgressPayload(?UserLessonProgress $progress): array
    {
        return [
            'status' => $progress?->status ?? 'not_started',
            'progress_percentage' => (float) ($progress?->progress_percentage ?? 0),
            'watch_duration_seconds' => (int) ($progress?->watch_duration_seconds ?? 0),
            'last_watched_at' => $progress?->last_watched_at,
            'last_position_seconds' => (int) ($progress?->last_position_seconds ?? 0),
            'completed_at' => $progress?->completed_at,
        ];
    }
}

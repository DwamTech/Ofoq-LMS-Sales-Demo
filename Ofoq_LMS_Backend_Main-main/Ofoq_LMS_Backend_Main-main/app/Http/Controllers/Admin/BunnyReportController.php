<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\BunnySyncLog;
use App\Models\BunnyVideoStat;
use App\Services\BunnyReportingService;
use App\Services\BunnySyncService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class BunnyReportController extends Controller
{
    public function overview(BunnyReportingService $reportingService)
    {
        return response()->json([
            'success' => true,
            'data' => $reportingService->overview(),
        ]);
    }

    public function videos(Request $request)
    {
        $perPage = min((int) $request->query('per_page', 25), 100);

        $videos = BunnyVideoStat::query()
            ->with(['lesson:id,title,chapter_id', 'lesson.chapter:id,course_id'])
            ->when($request->query('search'), function ($query, string $search) {
                $query->where(function ($nested) use ($search) {
                    $nested->where('title', 'like', "%{$search}%")
                        ->orWhere('video_guid', 'like', "%{$search}%");
                });
            })
            ->when($request->query('sync_status'), fn ($query, string $status) => $query->where('sync_status', $status))
            ->orderByDesc('last_synced_at')
            ->paginate($perPage);

        $videos->getCollection()->transform(fn (BunnyVideoStat $video) => $this->videoSummary($video));

        return response()->json([
            'success' => true,
            'data' => $videos,
        ]);
    }

    public function syncLogs(Request $request)
    {
        $perPage = min((int) $request->query('per_page', 25), 100);

        $logs = BunnySyncLog::query()
            ->when($request->query('sync_type'), fn ($query, string $type) => $query->where('sync_type', $type))
            ->when($request->query('status'), fn ($query, string $status) => $query->where('status', $status))
            ->orderByDesc('started_at')
            ->paginate($perPage);

        $logs->getCollection()->transform(fn (BunnySyncLog $log) => $this->syncLogSummary($log));

        return response()->json([
            'success' => true,
            'data' => $logs,
        ]);
    }

    public function runSync(Request $request, BunnySyncService $syncService)
    {
        $validated = $request->validate([
            'sync_type' => ['required', 'string', Rule::in(BunnySyncService::allowedSyncTypes())],
            'limit' => ['nullable', 'integer', 'min:1', 'max:100'],
            'dry_run' => ['nullable', 'boolean'],
            'video_guid' => ['nullable', 'string', 'max:255'],
            'lesson_id' => ['nullable', 'integer', 'exists:lessons,id'],
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date'],
            'hourly' => ['nullable', 'boolean'],
        ]);

        $options = [
            'limit' => $validated['limit'] ?? 25,
            'dry_run' => (bool) ($validated['dry_run'] ?? true),
            'video_guid' => $validated['video_guid'] ?? null,
            'lesson_id' => $validated['lesson_id'] ?? null,
            'from' => $validated['from'] ?? null,
            'to' => $validated['to'] ?? null,
            'hourly' => (bool) ($validated['hourly'] ?? false),
            'triggered_by' => 'admin_api',
            'user_id' => $request->user()?->id,
        ];

        $log = match ($validated['sync_type']) {
            BunnySyncService::SYNC_VIDEO_DETAILS => $syncService->syncVideoDetails($options),
            BunnySyncService::SYNC_USAGE => $syncService->syncUsage($options),
            BunnySyncService::SYNC_COSTS => $syncService->calculateCosts($options),
            BunnySyncService::SYNC_HEALTH_CHECK => $syncService->healthCheck($options),
        };

        return response()->json([
            'success' => true,
            'data' => [
                'accepted' => true,
                'completed' => $log->finished_at !== null,
                'sync_type' => $log->sync_type,
                'dry_run' => $log->dry_run,
                'limit' => $log->limit,
                'sync_log_id' => $log->id,
                'status' => $log->status,
                'message' => $log->message,
            ],
        ], 202);
    }

    private function videoSummary(BunnyVideoStat $video): array
    {
        return [
            'id' => $video->id,
            'lesson_id' => $video->lesson_id,
            'video_guid' => $video->video_guid,
            'title' => $video->title,
            'status' => [
                'code' => $video->status_code,
                'label' => $video->status_label,
                'sync_status' => $video->sync_status,
            ],
            'duration_seconds' => $video->duration_seconds,
            'storage_size_bytes' => $video->storage_size_bytes,
            'views' => $video->views,
            'average_watch_time_seconds' => $video->average_watch_time_seconds,
            'total_watch_time_seconds' => $video->total_watch_time_seconds,
            'thumbnail_url' => $video->thumbnail_url,
            'last_synced_at' => $video->last_synced_at,
            'data_source' => $video->data_source,
            'accuracy_level' => $video->accuracy_level,
            'lesson' => $video->lesson ? [
                'lesson_id' => $video->lesson->id,
                'lesson_title' => $video->lesson->title,
                'course_id' => $video->lesson->chapter?->course_id,
            ] : null,
        ];
    }

    private function syncLogSummary(BunnySyncLog $log): array
    {
        return [
            'id' => $log->id,
            'sync_type' => $log->sync_type,
            'status' => $log->status,
            'dry_run' => $log->dry_run,
            'limit' => $log->limit,
            'processed_count' => $log->processed_count,
            'succeeded_count' => $log->succeeded_count,
            'failed_count' => $log->failed_count,
            'skipped_count' => $log->skipped_count,
            'started_at' => $log->started_at,
            'finished_at' => $log->finished_at,
            'duration_ms' => $log->duration_ms,
            'message' => $log->message,
            'error_message' => $log->error_message ? str($log->error_message)->limit(500)->toString() : null,
            'metadata_summary' => $this->metadataSummary($log->metadata),
        ];
    }

    private function metadataSummary(?array $metadata): ?array
    {
        if (!$metadata) {
            return null;
        }

        return [
            'keys' => array_values(array_slice(array_keys($metadata), 0, 20)),
            'keys_count' => count($metadata),
        ];
    }
}

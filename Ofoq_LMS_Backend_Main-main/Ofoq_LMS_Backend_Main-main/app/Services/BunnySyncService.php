<?php

namespace App\Services;

use App\Models\BunnySyncLog;
use App\Models\BunnyVideoStat;
use App\Models\Lesson;
use Illuminate\Support\Facades\Schema;
use Throwable;

class BunnySyncService
{
    public const SYNC_VIDEO_DETAILS = 'video_details';
    public const SYNC_USAGE = 'usage';
    public const SYNC_COSTS = 'costs';
    public const SYNC_HEALTH_CHECK = 'health_check';

    public function __construct(
        private BunnyReportingService $reportingService,
        private BunnyCostCalculatorService $costCalculatorService
    ) {
    }

    public function syncVideoDetails(array $options = []): BunnySyncLog
    {
        $limit = $this->safeLimit($options['limit'] ?? 50);
        $dryRun = (bool) ($options['dry_run'] ?? false);
        $log = $this->startLog(self::SYNC_VIDEO_DETAILS, $limit, $dryRun, $options);

        $query = Lesson::query()->whereNotNull('video_guid')->orderBy('id');

        if (!empty($options['lesson_id'])) {
            $query->where('id', $options['lesson_id']);
        }

        if (!empty($options['video_guid'])) {
            $query->where('video_guid', $options['video_guid']);
        }

        $lessons = $query->limit($limit)->get();

        foreach ($lessons as $lesson) {
            $log->processed_count++;

            try {
                $result = $this->reportingService->syncVideoDetails($lesson, $dryRun);
                $result['status'] === 'synced' ? $log->succeeded_count++ : $log->failed_count++;
            } catch (Throwable $e) {
                $log->failed_count++;
                $this->appendLogError($log, "Lesson {$lesson->id}: {$e->getMessage()}");
            }
        }

        if ($lessons->isEmpty()) {
            $log->message = 'No lessons with Bunny video GUIDs matched the requested filters.';
        }

        return $this->finishLog($log);
    }

    public function syncUsage(array $options = []): BunnySyncLog
    {
        $limit = $this->safeLimit($options['limit'] ?? 25);
        $dryRun = (bool) ($options['dry_run'] ?? false);
        $from = $options['from'] ?? now()->subDays(30)->toIso8601String();
        $to = $options['to'] ?? now()->toIso8601String();
        $hourly = (bool) ($options['hourly'] ?? false);
        $log = $this->startLog(self::SYNC_USAGE, $limit, $dryRun, $options);

        try {
            $log->processed_count++;
            $libraryResult = $this->reportingService->syncLibraryStatistics($from, $to, $hourly, $dryRun);
            $libraryResult['status'] === 'synced' ? $log->succeeded_count++ : $log->failed_count++;
        } catch (Throwable $e) {
            $log->failed_count++;
            $this->appendLogError($log, "Library statistics: {$e->getMessage()}");
        }

        $query = Lesson::query()->whereNotNull('video_guid')->orderBy('id');

        if (!empty($options['video_guid'])) {
            $query->where('video_guid', $options['video_guid']);
        }

        foreach ($query->limit($limit)->get() as $lesson) {
            $log->processed_count++;

            try {
                $result = $this->reportingService->syncVideoStatistics($lesson, $from, $to, $hourly, $dryRun);
                $result['status'] === 'synced' ? $log->succeeded_count++ : $log->failed_count++;
            } catch (Throwable $e) {
                $log->failed_count++;
                $this->appendLogError($log, "Video {$lesson->video_guid}: {$e->getMessage()}");
            }
        }

        return $this->finishLog($log);
    }

    public function calculateCosts(array $options = []): BunnySyncLog
    {
        $dryRun = (bool) ($options['dry_run'] ?? false);
        $from = $options['from'] ?? now()->startOfMonth()->toIso8601String();
        $to = $options['to'] ?? now()->toIso8601String();
        $log = $this->startLog(self::SYNC_COSTS, 1, $dryRun, $options);

        try {
            $log->processed_count++;
            $result = $this->costCalculatorService->calculate($from, $to, $dryRun);
            in_array($result['status'], ['estimated', 'estimated_partial', 'missing_settings'], true)
                ? $log->succeeded_count++
                : $log->failed_count++;
            $log->message = "Cost status: {$result['status']}";
        } catch (Throwable $e) {
            $log->failed_count++;
            $this->appendLogError($log, $e->getMessage());
        }

        return $this->finishLog($log);
    }

    public function healthCheck(array $options = []): BunnySyncLog
    {
        $dryRun = (bool) ($options['dry_run'] ?? false);
        $log = $this->startLog(self::SYNC_HEALTH_CHECK, 1, $dryRun, $options);
        $checks = [
            'bunny_video_stats' => Schema::hasTable('bunny_video_stats'),
            'bunny_usage_snapshots' => Schema::hasTable('bunny_usage_snapshots'),
            'bunny_video_usage_snapshots' => Schema::hasTable('bunny_video_usage_snapshots'),
            'bunny_sync_logs' => Schema::hasTable('bunny_sync_logs'),
            'bunny_cost_settings' => Schema::hasTable('bunny_cost_settings'),
            'bunny_cost_snapshots' => Schema::hasTable('bunny_cost_snapshots'),
            'videos_with_guid' => Lesson::whereNotNull('video_guid')->count(),
            'synced_video_stats' => Schema::hasTable('bunny_video_stats') ? BunnyVideoStat::count() : 0,
        ];

        $log->processed_count = count($checks);
        $log->succeeded_count = collect($checks)->filter()->count();
        $log->failed_count = collect($checks)->filter(fn ($value) => $value === false)->count();
        $log->metadata = array_merge($log->metadata ?? [], ['checks' => $checks]);

        return $this->finishLog($log, $log->failed_count > 0 ? 'completed_with_warnings' : 'completed');
    }

    public static function allowedSyncTypes(): array
    {
        return [
            self::SYNC_VIDEO_DETAILS,
            self::SYNC_USAGE,
            self::SYNC_COSTS,
            self::SYNC_HEALTH_CHECK,
        ];
    }

    private function startLog(string $syncType, ?int $limit, bool $dryRun, array $metadata): BunnySyncLog
    {
        return BunnySyncLog::create([
            'sync_type' => $syncType,
            'status' => 'running',
            'dry_run' => $dryRun,
            'limit' => $limit,
            'metadata' => $this->sanitizeMetadata($metadata),
            'started_at' => now(),
        ]);
    }

    private function finishLog(BunnySyncLog $log, string $status = 'completed'): BunnySyncLog
    {
        $log->status = $log->failed_count > 0 && $status === 'completed' ? 'completed_with_errors' : $status;
        $log->finished_at = now();
        $log->duration_ms = $log->started_at ? (int) $log->started_at->diffInMilliseconds($log->finished_at) : null;
        $log->save();

        return $log->fresh();
    }

    private function appendLogError(BunnySyncLog $log, string $message): void
    {
        $log->error_message = trim(($log->error_message ? $log->error_message . "\n" : '') . $message);
    }

    private function safeLimit(mixed $limit): int
    {
        return max(1, min((int) $limit, 100));
    }

    private function sanitizeMetadata(array $metadata): array
    {
        unset($metadata['api_key'], $metadata['access_key'], $metadata['authorization']);

        return $metadata;
    }
}

<?php

namespace App\Services;

use App\Models\BunnyUsageSnapshot;
use App\Models\BunnyVideoStat;
use App\Models\BunnyVideoUsageSnapshot;
use App\Models\Lesson;

class BunnyReportingService
{
    public function __construct(private BunnyStreamService $bunnyStreamService)
    {
    }

    public function syncVideoDetails(Lesson $lesson, bool $dryRun = false): array
    {
        $details = $this->bunnyStreamService->getVideo($lesson->video_guid);

        if (!$details) {
            if (!$dryRun) {
                BunnyVideoStat::updateOrCreate(
                    ['video_guid' => $lesson->video_guid],
                    [
                        'lesson_id' => $lesson->id,
                        'sync_status' => 'failed',
                        'data_source' => 'bunny_stream_video_details',
                        'accuracy_level' => 'unavailable',
                        'last_synced_at' => now(),
                    ]
                );
            }

            return ['status' => 'failed', 'message' => 'Video details unavailable'];
        }

        $payload = $this->videoDetailsPayload($lesson, $details);

        if (!$dryRun) {
            BunnyVideoStat::updateOrCreate(['video_guid' => $lesson->video_guid], $payload);
        }

        return ['status' => 'synced', 'payload' => $payload];
    }

    public function syncLibraryStatistics(?string $from, ?string $to, bool $hourly = false, bool $dryRun = false): array
    {
        $statistics = $this->bunnyStreamService->getVideoStatistics(null, $from, $to, $hourly);

        if (!$statistics) {
            return ['status' => 'failed', 'message' => 'Library stream statistics unavailable'];
        }

        $payload = $this->statisticsPayload($statistics, $from, $to, $hourly, [
            'data_source' => 'bunny_stream_statistics',
            'metric_type' => 'library_stream_statistics',
            'unavailable_metrics' => [
                'video_library_level_usage.TrafficUsage',
                'video_library_level_usage.StorageUsage',
                'core_pull_zone_statistics.bandwidth',
                'core_pull_zone_statistics.requests',
            ],
        ]);

        $payload['total_storage_size_bytes'] = BunnyVideoStat::sum('storage_size_bytes') ?: null;

        if (!$dryRun) {
            BunnyUsageSnapshot::create($payload);
        }

        return ['status' => 'synced', 'payload' => $payload];
    }

    public function syncVideoStatistics(Lesson $lesson, ?string $from, ?string $to, bool $hourly = false, bool $dryRun = false): array
    {
        $statistics = $this->bunnyStreamService->getVideoStatistics($lesson->video_guid, $from, $to, $hourly);

        if (!$statistics) {
            return ['status' => 'failed', 'message' => 'Video stream statistics unavailable'];
        }

        $payload = $this->statisticsPayload($statistics, $from, $to, $hourly, [
            'lesson_id' => $lesson->id,
            'video_guid' => $lesson->video_guid,
            'data_source' => 'bunny_stream_video_statistics',
            'metric_type' => 'video_stream_statistics',
            'engagement_score' => $statistics['engagementScore'] ?? null,
            'unavailable_metrics' => [
                'video_level_bandwidth',
                'video_level_storage_traffic',
            ],
        ]);

        if (!$dryRun) {
            BunnyVideoUsageSnapshot::create($payload);
        }

        return ['status' => 'synced', 'payload' => $payload];
    }

    public function overview(): array
    {
        $latestUsage = BunnyUsageSnapshot::latest('id')->first();
        $latestCost = \App\Models\BunnyCostSnapshot::latest('id')->first();
        $lastSync = \App\Models\BunnySyncLog::latest('started_at')->first();

        return [
            'video_details' => [
                'videos_count' => BunnyVideoStat::count(),
                'synced_videos_count' => BunnyVideoStat::where('sync_status', 'synced')->count(),
                'failed_videos_count' => BunnyVideoStat::where('sync_status', 'failed')->count(),
                'total_storage_size_bytes' => BunnyVideoStat::sum('storage_size_bytes'),
                'total_duration_seconds' => BunnyVideoStat::sum('duration_seconds'),
                'total_views' => BunnyVideoStat::sum('views'),
                'total_watch_time_seconds' => BunnyVideoStat::sum('total_watch_time_seconds'),
                'data_source' => 'bunny_stream_video_details',
                'accuracy_level' => 'exact_when_synced_from_bunny',
            ],
            'stream_statistics' => [
                'latest_snapshot' => $latestUsage ? [
                    'id' => $latestUsage->id,
                    'period_start' => $latestUsage->period_start,
                    'period_end' => $latestUsage->period_end,
                    'hourly' => $latestUsage->hourly,
                    'total_views' => $latestUsage->total_views,
                    'total_watch_time_seconds' => $latestUsage->total_watch_time_seconds,
                    'total_storage_size_bytes' => $latestUsage->total_storage_size_bytes,
                    'traffic_usage_bytes' => $latestUsage->traffic_usage_bytes,
                    'storage_usage_bytes' => $latestUsage->storage_usage_bytes,
                    'bandwidth_bytes' => $latestUsage->bandwidth_bytes,
                    'requests_count' => $latestUsage->requests_count,
                    'data_source' => $latestUsage->data_source,
                    'metric_type' => $latestUsage->metric_type,
                    'accuracy_level' => $latestUsage->accuracy_level,
                    'sync_status' => $latestUsage->sync_status,
                    'last_synced_at' => $latestUsage->last_synced_at,
                    'unavailable_metrics' => $latestUsage->unavailable_metrics,
                ] : null,
                'data_source' => 'bunny_stream_statistics',
                'accuracy_level' => 'exact_when_returned_by_bunny',
            ],
            'costs' => [
                'latest_snapshot' => $latestCost ? [
                    'id' => $latestCost->id,
                    'period_start' => $latestCost->period_start,
                    'period_end' => $latestCost->period_end,
                    'storage_bytes' => $latestCost->storage_bytes,
                    'bandwidth_bytes' => $latestCost->bandwidth_bytes,
                    'storage_cost' => $latestCost->storage_cost,
                    'bandwidth_cost' => $latestCost->bandwidth_cost,
                    'fixed_cost' => $latestCost->fixed_cost,
                    'total_estimated_cost' => $latestCost->total_estimated_cost,
                    'currency' => $latestCost->currency,
                    'cost_status' => $latestCost->cost_status,
                    'data_source' => $latestCost->data_source,
                    'accuracy_level' => $latestCost->accuracy_level,
                    'unavailable_metrics' => $latestCost->unavailable_metrics,
                    'last_synced_at' => $latestCost->last_synced_at,
                ] : null,
                'accuracy_level' => 'estimated_or_unavailable',
            ],
            'last_sync' => $lastSync ? [
                'id' => $lastSync->id,
                'sync_type' => $lastSync->sync_type,
                'status' => $lastSync->status,
                'dry_run' => $lastSync->dry_run,
                'limit' => $lastSync->limit,
                'processed_count' => $lastSync->processed_count,
                'succeeded_count' => $lastSync->succeeded_count,
                'failed_count' => $lastSync->failed_count,
                'skipped_count' => $lastSync->skipped_count,
                'started_at' => $lastSync->started_at,
                'finished_at' => $lastSync->finished_at,
                'duration_ms' => $lastSync->duration_ms,
            ] : null,
            'unavailable' => [
                'video_library_level_usage.TrafficUsage',
                'video_library_level_usage.StorageUsage',
                'core_pull_zone_statistics.bandwidth',
                'core_pull_zone_statistics.requests',
            ],
        ];
    }

    private function videoDetailsPayload(Lesson $lesson, array $details): array
    {
        $thumbnailFileName = $details['thumbnailFileName'] ?? null;

        return [
            'lesson_id' => $lesson->id,
            'video_guid' => $lesson->video_guid,
            'title' => $details['title'] ?? null,
            'status_code' => $details['status'] ?? null,
            'status_label' => $this->statusLabel($details['status'] ?? null),
            'duration_seconds' => $details['length'] ?? null,
            'storage_size_bytes' => $details['storageSize'] ?? null,
            'views' => $details['views'] ?? null,
            'average_watch_time_seconds' => $details['averageWatchTime'] ?? null,
            'total_watch_time_seconds' => $details['totalWatchTime'] ?? null,
            'thumbnail_file_name' => $thumbnailFileName,
            'thumbnail_url' => $this->bunnyStreamService->getThumbnailUrl($lesson->video_guid, $thumbnailFileName),
            'collection_id' => $details['collectionId'] ?? null,
            'available_resolutions' => $details['availableResolutions'] ?? null,
            'data_source' => 'bunny_stream_video_details',
            'accuracy_level' => 'exact',
            'sync_status' => 'synced',
            'raw_payload' => $details,
            'last_synced_at' => now(),
        ];
    }

    private function statisticsPayload(array $statistics, ?string $from, ?string $to, bool $hourly, array $overrides): array
    {
        return array_merge([
            'period_start' => $from,
            'period_end' => $to,
            'hourly' => $hourly,
            'total_views' => $this->sumChart($statistics['viewsChart'] ?? []),
            'total_watch_time_seconds' => $this->sumChart($statistics['watchTimeChart'] ?? []),
            'data_source' => 'bunny_stream_statistics',
            'metric_type' => 'library_stream_statistics',
            'accuracy_level' => 'exact',
            'sync_status' => 'synced',
            'views_chart' => $statistics['viewsChart'] ?? null,
            'watch_time_chart' => $statistics['watchTimeChart'] ?? null,
            'country_view_counts' => $statistics['countryViewCounts'] ?? null,
            'country_watch_time' => $statistics['countryWatchTime'] ?? null,
            'raw_payload' => $statistics,
            'last_synced_at' => now(),
        ], $overrides);
    }

    private function sumChart(array $chart): ?int
    {
        if ($chart === []) {
            return null;
        }

        $total = 0;
        $found = false;

        foreach ($chart as $value) {
            if (is_numeric($value)) {
                $total += (float) $value;
                $found = true;
                continue;
            }

            if (!is_array($value)) {
                continue;
            }

            foreach (['views', 'watchTime', 'watchTimeSeconds', 'value', 'count'] as $key) {
                if (isset($value[$key]) && is_numeric($value[$key])) {
                    $total += (float) $value[$key];
                    $found = true;
                    break;
                }
            }
        }

        return $found ? (int) $total : null;
    }

    private function statusLabel(?int $status): ?string
    {
        return match ($status) {
            0 => 'created',
            1 => 'uploaded',
            2 => 'processing',
            3 => 'transcoding',
            4 => 'finished',
            5 => 'failed',
            6 => 'presigned_upload_started',
            7 => 'presigned_upload_finished',
            8 => 'presigned_upload_failed',
            default => null,
        };
    }
}

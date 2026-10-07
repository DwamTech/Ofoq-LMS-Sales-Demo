<?php

namespace App\Console\Commands;

use App\Services\BunnySyncService;
use Illuminate\Console\Command;

class BunnySyncUsage extends Command
{
    protected $signature = 'bunny:sync-usage
        {--from= : UTC start datetime, defaults to last 30 days}
        {--to= : UTC end datetime, defaults to now}
        {--video-guid= : Sync statistics for one Bunny video GUID}
        {--hourly : Request hourly statistics from Bunny}
        {--limit=25 : Maximum videos to process, capped at 100}
        {--dry-run : Fetch and validate without writing usage snapshots}';

    protected $description = 'Sync Bunny Stream library and video statistics into local reporting tables';

    public function handle(BunnySyncService $syncService): int
    {
        $log = $syncService->syncUsage([
            'from' => $this->option('from'),
            'to' => $this->option('to'),
            'video_guid' => $this->option('video-guid'),
            'hourly' => (bool) $this->option('hourly'),
            'limit' => $this->option('limit'),
            'dry_run' => (bool) $this->option('dry-run'),
        ]);

        $this->info("Bunny usage sync {$log->status}. Processed: {$log->processed_count}, succeeded: {$log->succeeded_count}, failed: {$log->failed_count}, skipped: {$log->skipped_count}.");

        return $log->failed_count > 0 ? self::FAILURE : self::SUCCESS;
    }
}

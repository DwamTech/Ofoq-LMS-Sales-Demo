<?php

namespace App\Console\Commands;

use App\Services\BunnySyncService;
use Illuminate\Console\Command;

class BunnySyncVideoDetails extends Command
{
    protected $signature = 'bunny:sync-video-details
        {--video-guid= : Sync one Bunny video GUID}
        {--lesson-id= : Sync one lesson ID}
        {--limit=50 : Maximum lessons to process, capped at 100}
        {--dry-run : Fetch and validate without writing reporting rows}';

    protected $description = 'Sync Bunny Stream video details into local reporting tables';

    public function handle(BunnySyncService $syncService): int
    {
        $log = $syncService->syncVideoDetails([
            'video_guid' => $this->option('video-guid'),
            'lesson_id' => $this->option('lesson-id'),
            'limit' => $this->option('limit'),
            'dry_run' => (bool) $this->option('dry-run'),
        ]);

        $this->info("Bunny video details sync {$log->status}. Processed: {$log->processed_count}, succeeded: {$log->succeeded_count}, failed: {$log->failed_count}, skipped: {$log->skipped_count}.");

        if ($log->message) {
            $this->line($log->message);
        }

        return $log->failed_count > 0 ? self::FAILURE : self::SUCCESS;
    }
}

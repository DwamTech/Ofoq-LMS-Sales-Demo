<?php

namespace App\Console\Commands;

use App\Services\BunnySyncService;
use Illuminate\Console\Command;

class BunnySyncHealthCheck extends Command
{
    protected $signature = 'bunny:sync-health-check
        {--dry-run : Record this health check as a dry run}';

    protected $description = 'Check local Bunny sync reporting foundation health';

    public function handle(BunnySyncService $syncService): int
    {
        $log = $syncService->healthCheck([
            'dry_run' => (bool) $this->option('dry-run'),
        ]);

        $this->info("Bunny sync health check {$log->status}. Passed: {$log->succeeded_count}, failed: {$log->failed_count}.");

        return $log->failed_count > 0 ? self::FAILURE : self::SUCCESS;
    }
}

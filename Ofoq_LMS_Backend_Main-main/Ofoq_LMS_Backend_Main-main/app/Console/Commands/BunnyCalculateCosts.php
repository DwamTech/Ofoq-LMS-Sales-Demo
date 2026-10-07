<?php

namespace App\Console\Commands;

use App\Services\BunnySyncService;
use Illuminate\Console\Command;

class BunnyCalculateCosts extends Command
{
    protected $signature = 'bunny:calculate-costs
        {--from= : Cost period start datetime, defaults to start of current month}
        {--to= : Cost period end datetime, defaults to now}
        {--dry-run : Calculate without writing a cost snapshot}';

    protected $description = 'Calculate conservative estimated Bunny costs from configured local settings';

    public function handle(BunnySyncService $syncService): int
    {
        $log = $syncService->calculateCosts([
            'from' => $this->option('from'),
            'to' => $this->option('to'),
            'dry_run' => (bool) $this->option('dry-run'),
        ]);

        $this->info("Bunny cost calculation {$log->status}. {$log->message}");

        return $log->failed_count > 0 ? self::FAILURE : self::SUCCESS;
    }
}

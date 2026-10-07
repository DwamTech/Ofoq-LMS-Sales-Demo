<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Database Backup Scheduler
// 1. Clean old backups daily at 01:00 AM
Schedule::command('backup:clean')->daily()->at('01:00');

// 2. Run new backup daily at 02:00 AM
Schedule::command('backup:run')->daily()->at('02:00');

// 3. Monitor backup health daily at 03:00 AM
Schedule::command('backup:monitor')->daily()->at('03:00');

// Certificate Auto-Retry Scheduler
// Automatically retry failed certificates every 30 minutes
Schedule::command('certificates:auto-retry')->everyThirtyMinutes();

// BunnyCDN Cleanup Scheduler
Schedule::command('bunny:cleanup')->daily()->at('04:00');

// BunnyCDN Sync Stuck Statuses Scheduler
Schedule::command('bunny:sync-status')->hourly();

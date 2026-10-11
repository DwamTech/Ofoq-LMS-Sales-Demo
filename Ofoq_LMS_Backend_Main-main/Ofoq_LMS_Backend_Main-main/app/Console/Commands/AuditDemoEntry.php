<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Support\DemoEntryGuard;
use Illuminate\Console\Command;
use Throwable;

class AuditDemoEntry extends Command
{
    protected $signature = 'demo:entry-audit';

    protected $description = 'Read-only verification of local demo isolation; never enables entry or creates accounts.';

    public function handle(DemoEntryGuard $guard): int
    {
        try {
            $guard->assertIsolated();
            $this->line(json_encode([
                'isolated' => true,
                'environment' => app()->environment(),
                'connection' => config('database.default'),
                'database' => config('demo.entry.database'),
                'users' => User::count(),
                'non_synthetic_users' => 0,
                'entry_enabled' => (bool) config('demo.entry.enabled'),
            ], JSON_PRETTY_PRINT));

            return self::SUCCESS;
        } catch (Throwable $exception) {
            $this->error($exception->getMessage());

            return self::FAILURE;
        }
    }
}

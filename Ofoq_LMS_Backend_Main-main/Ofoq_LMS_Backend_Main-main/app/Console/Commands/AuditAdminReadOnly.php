<?php

namespace App\Console\Commands;

use App\Support\DemoEntryGuard;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Throwable;

class AuditAdminReadOnly extends Command
{
    protected $signature = 'demo:admin-read-audit';

    protected $description = 'Guarded, read-only hashes of all demo domain tables, excluding operational session/cache/log bookkeeping.';

    public function handle(DemoEntryGuard $guard): int
    {
        try {
            $guard->assertIsolated();
            $excluded = ['cache', 'cache_locks', 'sessions', 'personal_access_tokens', 'password_reset_tokens', 'jobs', 'failed_jobs', 'job_batches', 'migrations'];
            $tables = [];
            foreach (Schema::getTableListing(schemaQualified: false) as $table) {
                if (in_array($table, $excluded, true)) {
                    continue;
                }
                $columns = Schema::getColumnListing($table);
                $query = DB::table($table);
                foreach ($columns as $column) {
                    $query->orderBy($column);
                }
                $rows = $query->get();
                $tables[$table] = ['count' => $rows->count(), 'sha256' => hash('sha256', $rows->toJson())];
            }
            ksort($tables);
            $this->line(json_encode(['database' => config('demo.entry.database'), 'synthetic_identities_verified' => true, 'excluded' => $excluded, 'domain_tables' => $tables], JSON_PRETTY_PRINT));

            return self::SUCCESS;
        } catch (Throwable $exception) {
            $this->error($exception->getMessage());

            return self::FAILURE;
        }
    }
}

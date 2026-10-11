<?php

namespace App\Console\Commands;

use App\Models\CategoryOfCourse;
use App\Models\CourseCertificate;
use App\Models\DiplomaCertificate;
use App\Models\User;
use App\Support\DemoEnvironmentGuard;
use Database\Seeders\DemoShowcaseSeeder;
use Illuminate\Console\Command;
use RuntimeException;

class PrepareDemoShowcase extends Command
{
    protected $signature = 'demo:prepare-showcase
        {--confirm-local-demo : Required acknowledgement that the local demo database is the intended target}';

    protected $description = 'Prepare the idempotent Ofoq sales-demo learning journey and certificate artifacts.';

    public function handle(): int
    {
        if (! $this->option('confirm-local-demo')) {
            $this->error('Refusing to modify data: pass --confirm-local-demo after verifying the target database.');

            return self::FAILURE;
        }

        try {
            DemoEnvironmentGuard::assertLocalDemo();
            $this->assertRestorableBackupExists();
        } catch (RuntimeException|\LogicException $exception) {
            $this->error($exception->getMessage());

            return self::FAILURE;
        }

        $before = $this->counts();

        try {
            app(DemoShowcaseSeeder::class)
                ->setContainer(app())
                ->setCommand($this)
                ->run();
        } catch (\Throwable $exception) {
            report($exception);
            $this->error('Demo showcase preparation failed: '.$exception->getMessage());

            return self::FAILURE;
        }

        $this->info('Demo showcase preparation completed safely.');
        $this->table(['Metric', 'Before', 'After'], collect($this->counts())
            ->map(fn ($after, $key) => [$key, $before[$key], $after])
            ->values()
            ->all());

        return self::SUCCESS;
    }

    /** @return array<string, int> */
    private function counts(): array
    {
        return [
            'users' => User::count(),
            'published_diplomas' => CategoryOfCourse::where('is_published', true)->count(),
            'course_certificates' => CourseCertificate::count(),
            'diploma_certificates' => DiplomaCertificate::count(),
        ];
    }

    private function assertRestorableBackupExists(): void
    {
        $backups = glob(storage_path('app/backups/demo/*restorable*.sql')) ?: [];

        if ($backups === []) {
            throw new RuntimeException('Refusing to modify data: create and retain a restorable SQL backup in storage/app/backups/demo first.');
        }
    }
}

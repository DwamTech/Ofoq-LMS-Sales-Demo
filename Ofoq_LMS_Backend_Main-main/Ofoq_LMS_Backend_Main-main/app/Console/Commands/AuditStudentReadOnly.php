<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Support\DemoEntryGuard;
use App\Support\DemoPersonas;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Throwable;

class AuditStudentReadOnly extends Command
{
    protected $signature = 'demo:student-read-audit';

    protected $description = 'Read-only hashes of showcase learning records; excludes session/log activity.';

    public function handle(DemoEntryGuard $guard): int
    {
        try {
            $guard->assertIsolated();
            $student = User::where('email', DemoPersonas::ACCOUNTS['student'])->firstOrFail();
            $tables = [];
            foreach (['user_courses', 'user_category_enrollments', 'user_lesson_progress', 'user_quizzes_attempts', 'course_certificates', 'diploma_certificates', 'certificates'] as $table) {
                $rows = DB::table($table)->where('user_id', $student->id)->orderBy('id')->get();
                $tables[$table] = ['count' => $rows->count(), 'sha256' => hash('sha256', $rows->toJson())];
            }
            $this->line(json_encode(['database' => config('demo.entry.database'), 'student' => $student->name, 'learning_records' => $tables], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

            return self::SUCCESS;
        } catch (Throwable $exception) {
            $this->error($exception->getMessage());

            return self::FAILURE;
        }
    }
}

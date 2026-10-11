<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use RuntimeException;
use Spatie\Permission\Models\Role;
use App\Support\DemoEnvironmentGuard;

/** Creates the two explicit, public-facing accounts for an already seeded demo DB. */
class DemoAccountsSeeder extends Seeder
{
    public function run(): void
    {
        DemoEnvironmentGuard::assertLocalDemo();
        $password = env('DEMO_ACCOUNT_PASSWORD');
        if (! is_string($password) || $password === '') {
            throw new RuntimeException('DEMO_ACCOUNT_PASSWORD must be set before running DemoAccountsSeeder.');
        }

        $admin = User::updateOrCreate(['email' => 'admin.demo@demo.ofoq.local'], [
            'name' => 'Ofoq Demo Admin',
            'password' => Hash::make($password),
            'role' => 'admin',
            'email_verified_at' => now(),
            'nationality' => 'مصر',
            'qualification' => 'إدارة المنصات التعليمية',
        ]);

        $adminRole = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'sanctum']);
        $admin->syncRoles([$adminRole]);

        // A subsequent run must retain the same showcase persona. Only the
        // initial setup is allowed to adopt a rich pre-existing demo student.
        $student = User::query()
            ->where('email', 'student.demo@demo.ofoq.local')
            ->first();

        if (! $student) {
            $student = User::query()
            ->where('email', 'like', '%@demo.ofoq.local')
            ->where('email', '!=', 'admin.demo@demo.ofoq.local')
            ->withCount(['enrollments', 'categoryEnrollments', 'lessonProgress', 'videoWatchSessions', 'favoriteCourses', 'quizAttempts', 'diplomaCertificates'])
            ->withCount(['enrollments as completed_courses_count' => fn ($query) => $query->where('status', 'completed')])
            ->selectSub(
                \Illuminate\Support\Facades\DB::table('course_certificates')
                    ->selectRaw('count(*)')
                    ->whereColumn('course_certificates.user_id', 'users.id'),
                'course_certificates_count'
            )
            ->orderByDesc('diploma_certificates_count')
            ->orderByDesc('course_certificates_count')
            ->orderByDesc('completed_courses_count')
            ->orderByDesc('video_watch_sessions_count')
            ->orderByDesc('favorite_courses_count')
            ->first();
        }

        if (! $student) {
            throw new RuntimeException('No existing @demo.ofoq.local student was found. Run DemoSalesSeeder first.');
        }

        $student->forceFill([
            'email' => 'student.demo@demo.ofoq.local',
            'name' => 'ليان أحمد الكيلاني',
            'password' => Hash::make($password),
            'role' => 'student',
            'email_verified_at' => now(),
            'nationality' => 'مصر',
            'qualification' => 'بكالوريوس',
            'media_work_sector' => 'التعليم والتقنية',
        ])->save();

        $studentRole = Role::firstOrCreate(['name' => 'student', 'guard_name' => 'sanctum']);
        $student->syncRoles([$studentRole]);
    }
}

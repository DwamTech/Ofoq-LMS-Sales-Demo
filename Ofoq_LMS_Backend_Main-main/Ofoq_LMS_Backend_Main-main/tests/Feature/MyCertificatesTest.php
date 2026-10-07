<?php

namespace Tests\Feature;

use App\Models\CategoryOfCourse;
use App\Models\Course;
use App\Models\CourseCertificate;
use App\Models\DiplomaCertificate;
use App\Models\User;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class MyCertificatesTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        Schema::create('users', function (Blueprint $table): void {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');
            $table->rememberToken();
            $table->timestamps();
        });

        Schema::create('category_of_course', function (Blueprint $table): void {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->timestamps();
        });

        Schema::create('courses', function (Blueprint $table): void {
            $table->id();
            $table->string('title');
            $table->foreignId('category_id')->nullable();
            $table->timestamps();
        });

        Schema::create('quizzes', function (Blueprint $table): void {
            $table->id();
            $table->string('title');
            $table->string('quizzable_type');
            $table->unsignedBigInteger('quizzable_id');
            $table->boolean('is_final')->default(false);
            $table->timestamps();
        });

        Schema::create('course_certificates', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id');
            $table->foreignId('course_id');
            $table->string('verification_token');
            $table->string('serial_number')->nullable();
            $table->json('certificate_data')->nullable();
            $table->string('file_path')->nullable();
            $table->timestamps();
        });

        Schema::create('diploma_certificates', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id');
            $table->foreignId('diploma_id');
            $table->string('verification_token');
            $table->string('serial_number')->nullable();
            $table->json('certificate_data')->nullable();
            $table->string('file_path')->nullable();
            $table->timestamp('issued_at')->nullable();
            $table->timestamps();
        });

        // The endpoint still reads legacy certificates, even when none exist.
        Schema::create('certificates', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id');
            $table->foreignId('course_id')->nullable();
            $table->string('verification_token')->nullable();
            $table->string('serial_number')->nullable();
            $table->json('certificate_data')->nullable();
            $table->string('file_path')->nullable();
            $table->timestamp('issued_at')->nullable();
            $table->timestamps();
        });
    }

    public function test_student_with_only_a_course_certificate_gets_a_successful_response(): void
    {
        [$user, $course] = $this->studentAndCourse();
        $this->createCourseCertificate($user, $course);

        $this->assertCertificates($user, 1, ['course']);
    }

    public function test_student_with_only_a_diploma_certificate_gets_a_successful_response(): void
    {
        [$user] = $this->studentAndCourse();
        $this->createDiplomaCertificate($user);

        $this->assertCertificates($user, 1, ['diploma']);
    }

    public function test_student_with_course_and_diploma_certificates_gets_both(): void
    {
        [$user, $course] = $this->studentAndCourse();
        $this->createCourseCertificate($user, $course);
        $this->createDiplomaCertificate($user);

        $this->assertCertificates($user, 2, ['course', 'diploma']);
    }

    public function test_student_without_certificates_gets_an_empty_list(): void
    {
        [$user] = $this->studentAndCourse();

        $this->assertCertificates($user, 0, []);
    }

    private function studentAndCourse(): array
    {
        $user = User::factory()->create();
        $diploma = CategoryOfCourse::query()->create(['name' => 'Diploma']);
        $course = Course::query()->create([
            'title' => 'Course',
            'category_id' => $diploma->id,
        ]);

        return [$user, $course, $diploma];
    }

    private function createCourseCertificate(User $user, Course $course): void
    {
        CourseCertificate::query()->create([
            'user_id' => $user->id,
            'course_id' => $course->id,
            'verification_token' => 'course-token-' . $user->id,
            'serial_number' => 'COURSE-' . $user->id,
            'certificate_data' => ['completion_date' => '2026-10-07'],
        ]);
    }

    private function createDiplomaCertificate(User $user): void
    {
        $diploma = CategoryOfCourse::query()->firstOrFail();

        DiplomaCertificate::query()->create([
            'user_id' => $user->id,
            'diploma_id' => $diploma->id,
            'verification_token' => 'diploma-token-' . $user->id,
            'serial_number' => 'DIPLOMA-' . $user->id,
            'certificate_data' => ['completion_date' => '2026-10-07'],
            'issued_at' => now(),
        ]);
    }

    private function assertCertificates(User $user, int $count, array $types): void
    {
        $response = $this->actingAs($user, 'sanctum')->getJson('/api/my-certificates');

        $response->assertOk()->assertJsonCount($count, 'certificates');
        $this->assertSame($types, collect($response->json('certificates'))->pluck('type')->sort()->values()->all());
    }
}

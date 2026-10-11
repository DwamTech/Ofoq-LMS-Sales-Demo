<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\EducationalReportService;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Mockery;

// Inherited fixture explicitly refuses all databases except SQLite :memory:.
class AdminShowcaseReadOnlyTest extends DemoEntryTest
{
    protected function setUp(): void
    {
        parent::setUp();
        Schema::create('category_of_course', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->nullable();
            $table->timestamps();
        });
        Schema::create('courses', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->unsignedBigInteger('category_id')->nullable();
            $table->boolean('is_published')->default(true);
            $table->timestamps();
        });
        Schema::create('user_courses', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('course_id');
            $table->string('status');
            $table->float('progress_percentage')->default(0);
            $table->float('final_exam_score')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
        });
        Schema::create('user_category_enrollments', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('category_id');
            $table->string('status');
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
        });
        Schema::create('quizzes', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('quizzable_type');
            $table->unsignedBigInteger('quizzable_id');
            $table->boolean('is_final')->default(true);
            $table->timestamps();
        });
        Schema::create('questions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('quiz_id');
            $table->string('question');
            $table->json('options');
            $table->string('correct_answer');
            $table->string('explanation')->nullable();
            $table->timestamps();
        });
        Schema::create('user_quizzes_attempts', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('quiz_id');
            $table->string('status');
            $table->float('score')->nullable();
            $table->timestamps();
        });
        foreach (['course_certificates', 'diploma_certificates', 'certificates'] as $name) {
            Schema::create($name, function (Blueprint $table) use ($name) {
                $table->id();
                $table->unsignedBigInteger('user_id');
                $table->unsignedBigInteger($name === 'diploma_certificates' ? 'diploma_id' : 'course_id');
                $table->string('status')->default('pending');
                $table->string('serial_number')->nullable();
                $table->timestamp('issued_at')->nullable();
                $table->timestamps();
            });
        }
        DB::table('category_of_course')->insert(['id' => 73, 'name' => 'Demo program', 'slug' => 'demo-program']);
        DB::table('courses')->insert(['id' => 97, 'title' => 'Demo course', 'category_id' => 73]);
        DB::table('quizzes')->insert(['id' => 61, 'title' => 'Final assessment', 'quizzable_type' => 'App\Models\Course', 'quizzable_id' => 97, 'is_final' => true]);
        DB::table('questions')->insert(['quiz_id' => 61, 'question' => 'Actual question', 'options' => '["A","B"]', 'correct_answer' => '1', 'explanation' => 'Private answer']);
        $student = User::where('role', 'student')->firstOrFail();
        DB::table('user_courses')->insert(['user_id' => $student->id, 'course_id' => 97, 'status' => 'completed', 'progress_percentage' => 100, 'final_exam_score' => null]);
        DB::table('user_category_enrollments')->insert(['user_id' => $student->id, 'category_id' => 73, 'status' => 'active']);
        DB::table('user_quizzes_attempts')->insert(['user_id' => $student->id, 'quiz_id' => 61, 'status' => 'in_progress']);
    }

    private function headers(string $role = 'admin'): array
    {
        $user = User::where('role', $role)->firstOrFail();

        return ['Authorization' => 'Bearer '.$user->createToken('ofoq-demo-gateway', ['demo:read-only', 'demo:persona:'.$role], now()->addMinutes(30))->plainTextToken];
    }

    public function test_phase06_student_list_is_admin_only_minimal_and_bounded(): void
    {
        $response = $this->getJson('/api/admin/showcase/students?showcase=1', $this->headers());
        $response->assertOk()->assertHeader('Cache-Control', 'no-store, private')->assertJsonCount(1, 'data');
        $this->assertSame(['id', 'name', 'courses_count', 'diplomas_count'], array_keys($response->json('data.0')));
        $this->getJson('/api/admin/showcase/students?per_page=51', $this->headers())->assertUnprocessable();
        $this->getJson('/api/admin/showcase/students?search=unmatched', $this->headers())->assertJsonCount(0, 'data');
        $this->getJson('/api/admin/showcase/students', $this->headers('student'))->assertForbidden();
        app('auth')->forgetGuards();
        $this->getJson('/api/admin/showcase/students')->assertUnauthorized();
    }

    public function test_phase06_exam_read_has_real_attempt_counts_no_answer_keys_and_no_writes(): void
    {
        $before = DB::table('user_quizzes_attempts')->get()->toJson();
        $response = $this->getJson('/api/admin/showcase/exams/97', $this->headers());
        $response->assertOk()->assertJsonPath('data.exam.question_count', 1)->assertJsonPath('data.attempts_by_status.in_progress', 1);
        $this->assertSame(['id', 'question', 'options'], array_keys($response->json('data.questions.0')));
        $this->assertSame($before, DB::table('user_quizzes_attempts')->get()->toJson());
        $this->getJson('/api/admin/showcase/exams/97', $this->headers('student'))->assertForbidden();
        $this->getJson('/api/admin/showcase/exams/999', $this->headers())->assertNotFound();
    }

    public function test_phase06_student_projection_preserves_attempt_and_pending_certificate_states(): void
    {
        $student = User::where('role', 'student')->firstOrFail();
        DB::table('course_certificates')->insert(['user_id' => $student->id, 'course_id' => 97, 'status' => 'pending', 'serial_number' => null]);
        $service = Mockery::mock(EducationalReportService::class);
        $service->shouldReceive('studentReport')->once()->andReturn(['student' => ['email' => 'hidden', 'phone' => 'hidden'], 'courses' => [['course_id' => 97]], 'diplomas' => [], 'estimated_bunny_cost' => ['amount' => 99]]);
        $this->app->instance(EducationalReportService::class, $service);
        $before = DB::table('course_certificates')->get()->toJson();
        $response = $this->getJson('/api/admin/showcase/students/'.$student->id, $this->headers());
        $response->assertOk()->assertJsonPath('data.courses.0.exam_status', 'in_progress')->assertJsonPath('data.courses.0.academic_completed', false)->assertJsonPath('data.certificates.0.status', 'pending')->assertJsonPath('data.certificates.0.issued_at', null);
        $this->assertSame(['id', 'name'], array_keys($response->json('data.student')));
        $this->assertArrayNotHasKey('estimated_bunny_cost', $response->json('data'));
        $this->assertArrayNotHasKey('file_path', $response->json('data.certificates.0'));
        $this->assertSame($before, DB::table('course_certificates')->get()->toJson());
    }

    public function test_phase06_administrative_student_diploma_progress_uses_academic_completion(): void
    {
        $student = User::where('role', 'student')->firstOrFail();
        $method = new \ReflectionMethod(EducationalReportService::class, 'studentDiplomas');
        $before = DB::table('user_category_enrollments')->get()->toJson();
        $result = $method->invoke(app(EducationalReportService::class), $student, []);
        $this->assertSame(0.0, $result[0]['progress_percentage']); // 100% lessons, mandatory final not passed.
        DB::table('user_courses')->update(['final_exam_score' => 83.33]); // SQLite fixture only.
        $result = $method->invoke(app(EducationalReportService::class), $student, []);
        $this->assertSame(100.0, $result[0]['progress_percentage']);
        $this->assertSame($before, DB::table('user_category_enrollments')->get()->toJson());
    }

    public function test_phase06_role_object_and_scope_boundaries_remain_closed(): void
    {
        $headers = $this->headers();
        $admin = User::where('role', 'admin')->firstOrFail();
        $this->getJson('/api/admin/showcase/students/'.$admin->id, $headers)->assertNotFound();
        $this->getJson('/api/admin/showcase/students/999', $headers)->assertNotFound();
        foreach (['/api/admin/bunny/reports/overview', '/api/admin/backups', '/api/admin/supervisors'] as $path) {
            $this->getJson($path, $headers)->assertForbidden()->assertJsonPath('code', 'DEMO_SCOPE_DENIED');
        }
        $this->postJson('/api/admin/courses', ['title' => 'Must not save'], $headers)->assertForbidden()->assertJsonPath('code', 'DEMO_READ_ONLY');
        $this->assertSame(1, DB::table('courses')->count());
        $this->getJson('/api/admin/showcase/students/1', $this->headers('student'))->assertForbidden();
    }
}

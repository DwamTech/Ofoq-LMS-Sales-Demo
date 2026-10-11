<?php

namespace Tests\Feature;

use App\Http\Controllers\UserLessonController;
use App\Http\Resources\ExamQuestionResource;
use App\Http\Resources\QuestionResource;
use App\Models\Question;
use App\Models\User;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;

// Parent fixtures explicitly refuse everything except SQLite :memory:.
class StudentLearningReadOnlyTest extends DemoEntryTest
{
    protected function setUp(): void
    {
        parent::setUp();
        Schema::create('course_certificates', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->string('status');
            $table->string('file_path')->nullable();
            $table->timestamps();
        });
        Storage::fake('public');
    }

    private function studentHeaders(string $role = 'student'): array
    {
        $user = User::where('role', $role)->firstOrFail();

        return ['Authorization' => 'Bearer '.$user->createToken('ofoq-demo-gateway', ['demo:read-only', 'demo:persona:'.$role], now()->addMinutes(30))->plainTextToken];
    }

    public function test_phase05_download_is_owned_issued_and_read_only(): void
    {
        Storage::disk('public')->put('unit.pdf', '%PDF-1.4 unit-test-signature-only');
        $student = User::where('role', 'student')->firstOrFail();
        $id = DB::table('course_certificates')->insertGetId(['user_id' => $student->id, 'status' => 'completed', 'file_path' => 'unit.pdf']);
        $before = DB::table('course_certificates')->get()->toJson();
        $this->get('/api/student/certificates/course/'.$id.'/download', $this->studentHeaders())->assertOk()->assertHeader('Content-Type', 'application/pdf')->assertHeader('Cache-Control', 'no-store, private');
        $this->assertSame($before, DB::table('course_certificates')->get()->toJson());
        $this->getJson('/api/student/certificates/course/'.$id.'/download', $this->studentHeaders('admin'))->assertForbidden();
    }

    public function test_phase05_foreign_pending_missing_and_invalid_pdf_are_rejected(): void
    {
        $headers = $this->studentHeaders();
        $student = User::where('role', 'student')->firstOrFail();
        $admin = User::where('role', 'admin')->firstOrFail();
        Storage::disk('public')->put('invalid.pdf', 'This is not a PDF.');
        foreach ([[$admin->id, 'issued', 'invalid.pdf'], [$student->id, 'pending', 'invalid.pdf'], [$student->id, 'issued', 'missing.pdf'], [$student->id, 'issued', 'invalid.pdf'], [$student->id, 'issued', '../outside.pdf']] as [$owner, $status, $path]) {
            $id = DB::table('course_certificates')->insertGetId(['user_id' => $owner, 'status' => $status, 'file_path' => $path]);
            $this->getJson('/api/student/certificates/course/'.$id.'/download', $headers)->assertNotFound();
        }
    }

    public function test_phase05_download_requires_authentication(): void
    {
        $this->getJson('/api/student/certificates/course/1/download')->assertUnauthorized();
    }

    public function test_phase05_question_dto_has_no_answer_keys_explanations_or_option_flags(): void
    {
        $question = new Question(['id' => 97, 'question' => 'سؤال فعلي', 'correct_answer' => 1, 'explanation' => 'Protected', 'options' => [['text' => 'أ', 'is_correct' => false], ['text' => 'ب', 'is_correct' => true]]]);
        $data = (new ExamQuestionResource($question))->resolve(Request::create('/'));
        $this->assertSame(['id', 'question', 'options'], array_keys($data));
        $this->assertSame(['أ', 'ب'], $data['options']);
        $this->assertStringNotContainsString('correct', json_encode($data));
    }

    public function test_phase05_progress_recalculation_performs_no_database_writes_in_demo(): void
    {
        $queries = [];
        DB::listen(function ($query) use (&$queries) {
            $queries[] = $query->sql;
        });
        $method = new \ReflectionMethod(UserLessonController::class, 'updateCourseProgress');
        $method->invoke(new UserLessonController, 1, 1);
        $this->assertSame([], $queries);
    }

    public function test_phase05_lesson_and_progress_gets_never_create_or_touch_learning_records(): void
    {
        Schema::create('courses', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->boolean('is_published');
            $table->unsignedBigInteger('category_id')->nullable();
        });
        Schema::create('chapters', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('course_id');
            $table->integer('order')->default(1);
        });
        Schema::create('lessons', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('chapter_id');
            $table->string('title');
            $table->boolean('is_visible')->default(true);
        });
        Schema::create('user_courses', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('course_id');
            $table->string('status');
            $table->float('progress_percentage');
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
        });
        Schema::create('user_lesson_progress', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('lesson_id');
            $table->string('status');
        });
        $student = User::where('role', 'student')->firstOrFail();
        // Raw inserts only into guarded in-memory fixtures; avoid course created observers.
        DB::table('courses')->insert(['id' => 1, 'title' => 'مقرر اختباري', 'is_published' => true]);
        DB::table('chapters')->insert(['id' => 1, 'course_id' => 1]);
        DB::table('lessons')->insert(['id' => 1, 'chapter_id' => 1, 'title' => 'درس اختباري', 'is_visible' => false]);
        DB::table('user_courses')->insert(['user_id' => $student->id, 'course_id' => 1, 'status' => 'in_progress', 'progress_percentage' => 50]);
        config()->set('video_tracking.enabled', false);
        $headers = $this->studentHeaders();
        $before = DB::table('user_courses')->get()->toJson();
        $this->getJson('/api/lessons/1', $headers)->assertOk()->assertJsonPath('lesson.can_access', true)->assertJsonPath('lesson.is_visible', false);
        $this->getJson('/api/courses/1/progress', $headers)->assertOk()->assertJsonPath('course_progress.overall_progress', 50);
        $this->assertSame(0, DB::table('user_lesson_progress')->count());
        $this->assertSame($before, DB::table('user_courses')->get()->toJson());
    }

    public function test_phase05_exam_and_lesson_mutations_stay_forbidden(): void
    {
        $headers = $this->studentHeaders();
        foreach (['/api/courses/1/final-exam/start', '/api/courses/1/final-exam/submit/1', '/api/lessons/1/complete'] as $path) {
            $this->postJson($path, [], $headers)->assertForbidden()->assertJsonPath('code', 'DEMO_READ_ONLY');
        }
    }

    public function test_phase05_generic_question_resource_keeps_answer_keys_admin_only(): void
    {
        $question = new Question(['question' => 'اختبار', 'options' => [['text' => 'أ', 'is_correct' => true], ['text' => 'ب', 'is_correct' => false]], 'correct_answer' => 0, 'explanation' => 'Private answer rationale']);
        $request = Request::create('/');
        $request->setUserResolver(fn () => User::where('role', 'student')->first());
        $student = (new QuestionResource($question))->resolve($request);
        $this->assertArrayNotHasKey('correct_answer', $student);
        $this->assertArrayNotHasKey('explanation', $student);
        $this->assertSame(['أ', 'ب'], $student['options']);
        $request->setUserResolver(fn () => User::where('role', 'admin')->first());
        $admin = (new QuestionResource($question))->resolve($request);
        $this->assertSame(0, $admin['correct_answer']);
        $this->assertSame('Private answer rationale', $admin['explanation']);
    }
}

<?php

namespace Tests\Unit;

use App\Models\CategoryOfCourse;
use App\Models\Course;
use App\Models\Question;
use App\Models\User;
use App\Models\UserCategoryEnrollment;
use App\Models\UserCourse;
use App\Services\BeneficiaryReportService;
use App\Services\DiplomaCompletionService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DiplomaCompletionServiceTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->artisan('migrate', ['--path' => 'database/seeders/migrations']);
    }

    public function test_it_derives_historical_diploma_completion_without_relying_on_enrollment_status(): void
    {
        $diploma = CategoryOfCourse::create(['name' => 'الدبلومة التاريخية']);
        $course = Course::create(['title' => 'المقرر الأول', 'category_id' => $diploma->id, 'is_published' => true]);
        Question::create(['quiz_id' => $course->finalExam->id, 'question' => 'سؤال اختباري', 'correct_answer' => 'أ']);

        $student = User::create(['name' => 'طالب', 'email' => 'student@example.test', 'password' => 'password', 'role' => 'student']);
        $enrollment = UserCategoryEnrollment::create(['user_id' => $student->id, 'category_id' => $diploma->id, 'status' => 'active']);
        UserCourse::create([
            'user_id' => $student->id,
            'course_id' => $course->id,
            'status' => 'completed',
            'final_exam_score' => 80,
            'completed_at' => now()->subDay(),
        ]);

        $details = app(DiplomaCompletionService::class)->forEnrollments(collect([$enrollment]))->get($enrollment->id);

        $this->assertTrue($details['completed']);
        $this->assertSame(100.0, $details['progress_percentage']);
        $this->assertNotNull($details['completed_at']);
        $this->assertSame('active', $enrollment->fresh()->status);
    }

    public function test_beneficiary_report_counts_unique_students_once_across_a_diploma_and_its_course(): void
    {
        $diploma = CategoryOfCourse::create(['name' => 'دبلومة البيانات']);
        $course = Course::create(['title' => 'مسار البيانات', 'category_id' => $diploma->id, 'is_published' => true]);
        Question::create(['quiz_id' => $course->finalExam->id, 'question' => 'سؤال اختباري', 'correct_answer' => 'أ']);

        $student = User::create(['name' => 'مستفيد', 'email' => 'beneficiary@example.test', 'password' => 'password', 'role' => 'student']);
        UserCategoryEnrollment::create(['user_id' => $student->id, 'category_id' => $diploma->id, 'status' => 'active']);
        UserCourse::create([
            'user_id' => $student->id,
            'course_id' => $course->id,
            'status' => 'completed',
            'final_exam_score' => 95,
            'completed_at' => now(),
        ]);

        $report = app(BeneficiaryReportService::class)->report([]);

        $this->assertSame(1, $report['summary']['total_beneficiaries']);
        $this->assertSame(1, $report['summary']['completed_any_course']);
        $this->assertSame(1, $report['summary']['completed_any_diploma']);
        $this->assertSame(1, $report['summary']['completed_any_learning_path']);
        $this->assertSame(1, $report['diplomas'][0]['completed_count']);
    }
}

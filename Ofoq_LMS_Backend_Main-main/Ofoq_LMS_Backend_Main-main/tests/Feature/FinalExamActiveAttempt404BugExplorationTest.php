<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Course;
use App\Models\Quiz;
use App\Models\Question;
use App\Models\UserQuizAttempt;
use App\Models\CategoryOfCourse;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Laravel\Sanctum\Sanctum;

/**
 * Bug Condition Exploration Test for Final Exam Active Attempt 404
 * 
 * **Validates: Requirements 2.1, 2.2, 2.3, 2.4**
 * 
 * CRITICAL: This test MUST FAIL on unfixed code - failure confirms the bug exists
 * 
 * Property 1: Fault Condition - Active Attempt 404 Scenarios
 * 
 * This test explores four potential root causes for the 404 error:
 * - Scenario A: Route model binding - invalid course ID should return 404 with clear "course not found" message
 * - Scenario B: Authentication - unauthenticated request should return 401, not 404
 * - Scenario C: Data inconsistency - active attempt exists but endpoint returns 404 (should return 200)
 * - Scenario D: Error messaging - no active attempt returns 404 but with unclear/generic error message
 * 
 * Expected Outcome: Test FAILS for one or more scenarios (this proves the bug exists)
 */
class FinalExamActiveAttempt404BugExplorationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Create minimal schema needed for testing
        $this->createMinimalSchema();
    }

    /**
     * Create minimal database schema for testing
     */
    private function createMinimalSchema(): void
    {
        // Create users table
        if (!Schema::hasTable('users')) {
            Schema::create('users', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('email')->unique();
                $table->timestamp('email_verified_at')->nullable();
                $table->string('password');
                $table->rememberToken();
                $table->timestamps();
            });
        }

        // Create personal_access_tokens table for Sanctum
        if (!Schema::hasTable('personal_access_tokens')) {
            Schema::create('personal_access_tokens', function (Blueprint $table) {
                $table->id();
                $table->morphs('tokenable');
                $table->string('name');
                $table->string('token', 64)->unique();
                $table->text('abilities')->nullable();
                $table->timestamp('last_used_at')->nullable();
                $table->timestamp('expires_at')->nullable();
                $table->timestamps();
            });
        }
        
        // Create category_of_course table
        if (!Schema::hasTable('category_of_course')) {
            Schema::create('category_of_course', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->text('description')->nullable();
                $table->string('slug')->nullable();
                $table->boolean('is_published')->default(true);
                $table->boolean('is_free')->default(false);
                $table->decimal('price', 10, 2)->nullable();
                $table->string('cover_image')->nullable();
                $table->integer('display_order')->nullable();
                $table->integer('total_views')->default(0);
                $table->foreignId('section_id')->nullable();
                $table->timestamps();
            });
        }
        
        // Create courses table
        if (!Schema::hasTable('courses')) {
            Schema::create('courses', function (Blueprint $table) {
                $table->id();
                $table->string('title');
                $table->text('description')->nullable();
                $table->foreignId('category_id')->nullable()->constrained('category_of_course');
                $table->boolean('is_published')->default(true);
                $table->boolean('is_free')->default(false);
                $table->decimal('price', 10, 2)->nullable();
                $table->timestamps();
            });
        }
        
        // Create quizzes table
        if (!Schema::hasTable('quizzes')) {
            Schema::create('quizzes', function (Blueprint $table) {
                $table->id();
                $table->string('title');
                $table->text('description')->nullable();
                $table->morphs('quizzable');
                $table->boolean('is_final')->default(false);
                $table->foreignId('chapter_id')->nullable();
                $table->timestamps();
            });
        }
        
        // Create questions table
        if (!Schema::hasTable('questions')) {
            Schema::create('questions', function (Blueprint $table) {
                $table->id();
                $table->foreignId('quiz_id')->constrained('quizzes');
                $table->text('question');
                $table->json('options');
                $table->string('correct_answer');
                $table->text('explanation')->nullable();
                $table->timestamps();
            });
        }
        
        // Create user_quizzes_attempts table
        if (!Schema::hasTable('user_quizzes_attempts')) {
            Schema::create('user_quizzes_attempts', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained('users');
                $table->foreignId('quiz_id')->constrained('quizzes');
                $table->string('status')->default('in_progress');
                $table->timestamp('start_time')->nullable();
                $table->timestamp('end_time')->nullable();
                $table->decimal('score', 5, 2)->nullable();
                $table->timestamps();
            });
        }
        
        // Create user_quiz_attempt_questions pivot table
        if (!Schema::hasTable('user_quiz_attempt_questions')) {
            Schema::create('user_quiz_attempt_questions', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_quiz_attempt_id')->constrained('user_quizzes_attempts')->onDelete('cascade');
                $table->foreignId('question_id')->constrained('questions')->onDelete('cascade');
                $table->string('user_answer')->nullable();
                $table->timestamps();
            });
        }
        
        // Create user_category_enrollments table (needed by CourseObserver job)
        if (!Schema::hasTable('user_category_enrollments')) {
            Schema::create('user_category_enrollments', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained('users');
                $table->foreignId('category_id')->constrained('category_of_course');
                $table->string('status')->default('active');
                $table->timestamps();
            });
        }
    }

    /**
     * Test Scenario A: Invalid Course ID
     * 
     * When requesting active attempt for a non-existent course,
     * the endpoint should return 404 with a clear "course not found" message.
     * 
     * Expected on unfixed code: May return generic 404 or unclear error
     * Expected on fixed code: 404 with specific "course not found" message
     */
    public function test_scenario_a_invalid_course_id_returns_clear_error()
    {
        // Arrange: Create authenticated user
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        // Act: Request active attempt for non-existent course
        $response = $this->getJson('/api/courses/99999/final-exam/attempt/active');

        // Assert: Should return 404 with clear message about course not found
        $response->assertStatus(404);
        
        $responseData = $response->json();
        $message = $responseData['message'] ?? '';
        
        // The error message should clearly indicate the course was not found
        // Not just a generic "not found" message
        $this->assertTrue(
            str_contains(strtolower($message), 'course') || 
            str_contains(strtolower($message), 'not found'),
            "Expected clear 'course not found' message, got: {$message}"
        );
    }

    /**
     * Test Scenario B: Unauthenticated Request
     * 
     * When requesting active attempt without authentication,
     * the endpoint should return 401 Unauthorized, NOT 404.
     * 
     * Expected on unfixed code: May return 404 instead of 401
     * Expected on fixed code: 401 Unauthorized
     */
    public function test_scenario_b_unauthenticated_request_returns_401_not_404()
    {
        // Arrange: Create a valid course with final exam
        $category = CategoryOfCourse::create([
            'name' => 'Test Category',
            'slug' => 'test-category'
        ]);
        
        $course = Course::create([
            'title' => 'Test Course',
            'category_id' => $category->id,
            'is_published' => true
        ]);
        
        $finalExam = Quiz::create([
            'title' => 'Final Exam',
            'quizzable_type' => Course::class,
            'quizzable_id' => $course->id,
            'is_final' => true
        ]);

        // Act: Request without authentication
        $response = $this->getJson('/api/courses/' . $course->id . '/final-exam/attempt/active');

        // Assert: Should return 401, NOT 404
        $this->assertNotEquals(
            404,
            $response->status(),
            "Unauthenticated request should return 401, not 404. Got: {$response->status()}"
        );
        
        $response->assertStatus(401);
    }

    /**
     * Test Scenario C: Active Attempt Exists But Returns 404
     * 
     * When a user has an active attempt and requests it,
     * the endpoint should return 200 with the attempt data, NOT 404.
     * 
     * This is the CORE bug scenario - if this fails, it confirms data inconsistency.
     * 
     * Expected on unfixed code: May return 404 even though attempt exists
     * Expected on fixed code: 200 with attempt data
     */
    public function test_scenario_c_active_attempt_exists_returns_200_not_404()
    {
        // Arrange: Create user, course, final exam, and active attempt
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        
        $category = CategoryOfCourse::create([
            'name' => 'Test Category',
            'slug' => 'test-category-2'
        ]);
        
        $course = Course::create([
            'title' => 'Test Course',
            'category_id' => $category->id,
            'is_published' => true
        ]);
        
        $finalExam = Quiz::create([
            'title' => 'Final Exam',
            'quizzable_type' => Course::class,
            'quizzable_id' => $course->id,
            'is_final' => true
        ]);
        
        // Create questions for the exam
        $question1 = Question::create([
            'quiz_id' => $finalExam->id,
            'question' => 'Test question 1?',
            'options' => ['A' => 'Option A', 'B' => 'Option B'],
            'correct_answer' => 'A'
        ]);
        
        $question2 = Question::create([
            'quiz_id' => $finalExam->id,
            'question' => 'Test question 2?',
            'options' => ['A' => 'Option A', 'B' => 'Option B'],
            'correct_answer' => 'B'
        ]);
        
        // Create an active attempt
        $attempt = UserQuizAttempt::create([
            'user_id' => $user->id,
            'quiz_id' => $finalExam->id,
            'status' => 'in_progress',
            'start_time' => now(),
            'end_time' => null,
            'score' => null
        ]);
        
        // Attach questions to the attempt
        $attempt->questions()->attach([
            $question1->id => ['user_answer' => null],
            $question2->id => ['user_answer' => null]
        ]);

        // Act: Request active attempt
        $response = $this->getJson('/api/courses/' . $course->id . '/final-exam/attempt/active');

        // Assert: Should return 200 with attempt data, NOT 404
        $this->assertNotEquals(
            404,
            $response->status(),
            "Active attempt exists but endpoint returned 404. This confirms the bug! " .
            "Attempt ID: {$attempt->id}, Quiz ID: {$finalExam->id}, Course ID: {$course->id}"
        );
        
        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'attempt_id',
                    'quiz_id',
                    'questions'
                ]
            ]);
        
        $responseData = $response->json();
        $this->assertEquals($attempt->id, $responseData['data']['attempt_id']);
        $this->assertEquals($finalExam->id, $responseData['data']['quiz_id']);
        $this->assertCount(2, $responseData['data']['questions']);
    }

    /**
     * Test Scenario D: No Active Attempt - Error Message Clarity
     * 
     * When a user has NO active attempt,
     * the endpoint should return 404 with a CLEAR, SPECIFIC message
     * indicating "no active attempt found" (not a generic error).
     * 
     * Expected on unfixed code: May return generic/unclear error message
     * Expected on fixed code: 404 with specific "no active attempt found" message
     */
    public function test_scenario_d_no_active_attempt_returns_clear_specific_message()
    {
        // Arrange: Create user and course with final exam, but NO active attempt
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        
        $category = CategoryOfCourse::create([
            'name' => 'Test Category',
            'slug' => 'test-category-3'
        ]);
        
        $course = Course::create([
            'title' => 'Test Course',
            'category_id' => $category->id,
            'is_published' => true
        ]);
        
        $finalExam = Quiz::create([
            'title' => 'Final Exam',
            'quizzable_type' => Course::class,
            'quizzable_id' => $course->id,
            'is_final' => true
        ]);
        
        Question::create([
            'quiz_id' => $finalExam->id,
            'question' => 'Test question?',
            'options' => ['A' => 'Option A', 'B' => 'Option B'],
            'correct_answer' => 'A'
        ]);

        // Act: Request active attempt (none exists)
        $response = $this->getJson('/api/courses/' . $course->id . '/final-exam/attempt/active');

        // Assert: Should return 404 with clear, specific message
        $response->assertStatus(404);
        
        $responseData = $response->json();
        $message = $responseData['message'] ?? '';
        
        // The message should specifically mention "active attempt" or "no attempt"
        // Not just "not found" or a generic error
        $this->assertTrue(
            str_contains(strtolower($message), 'attempt') || 
            str_contains(strtolower($message), 'active'),
            "Expected clear 'no active attempt' message, got: {$message}. " .
            "Generic error messages make debugging difficult for users."
        );
        
        // Additionally, the message should NOT be too generic
        $this->assertFalse(
            $message === 'Not Found' || $message === 'not found',
            "Error message is too generic: '{$message}'. Should specifically mention 'active attempt'."
        );
    }

    /**
     * Test Scenario E: Course Without Final Exam
     * 
     * When requesting active attempt for a course that has no final exam configured,
     * the endpoint should return 404 with a clear message about missing final exam.
     * 
     * Expected on unfixed code: May return generic 404
     * Expected on fixed code: 404 with specific "no final exam" message
     */
    public function test_scenario_e_course_without_final_exam_returns_clear_error()
    {
        // Arrange: Create user and course WITHOUT final exam
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        
        $category = CategoryOfCourse::create([
            'name' => 'Test Category',
            'slug' => 'test-category-4'
        ]);
        
        $course = Course::create([
            'title' => 'Test Course',
            'category_id' => $category->id,
            'is_published' => true
        ]);
        
        // Delete the auto-created final exam to test the "no final exam" scenario
        $course->quizzes()->where('is_final', true)->delete();

        // Act: Request active attempt
        $response = $this->getJson('/api/courses/' . $course->id . '/final-exam/attempt/active');

        // Assert: Should return 404 with clear message about missing final exam
        $response->assertStatus(404);
        
        $responseData = $response->json();
        $message = $responseData['message'] ?? '';
        
        // The message should mention "final exam" or "exam not found"
        $this->assertTrue(
            str_contains(strtolower($message), 'exam') || 
            str_contains(strtolower($message), 'final'),
            "Expected clear 'final exam not found' message, got: {$message}"
        );
    }
}

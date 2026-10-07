<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Course;
use App\Models\CategoryOfCourse;
use App\Models\UserCourse;
use App\Models\Quiz;
use App\Models\Question;
use App\Services\DiplomaEligibilityService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

/**
 * Bug Condition Exploration Test for Diploma Completion Percentage
 * 
 * **Validates: Requirements 2.1, 2.2, 2.3**
 * 
 * CRITICAL: This test MUST FAIL on unfixed code - failure confirms the bug exists
 * 
 * Property 1: Fault Condition - Correct Completion Percentage for Testable Courses
 * 
 * For any diploma containing courses with final exams that have zero questions AND 
 * where the student has completed all testable courses, calculateCompletionPercentage() 
 * should return 100.0
 * 
 * Expected Outcome: Test FAILS on unfixed code (this proves the bug exists)
 */
class DiplomaCompletionPercentageBugExplorationTest extends TestCase
{
    use RefreshDatabase;

    private DiplomaEligibilityService $service;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Create minimal schema needed for testing
        $this->createMinimalSchema();
        
        $this->service = new DiplomaEligibilityService();
    }
    
    /**
     * Create minimal database schema for testing
     */
    private function createMinimalSchema(): void
    {
        // Create users table
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->string('password');
            $table->timestamps();
        });
        
        // Create category_of_course table
        Schema::create('category_of_course', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('slug')->nullable();
            $table->timestamps();
        });
        
        // Create courses table
        Schema::create('courses', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->foreignId('category_id')->nullable()->constrained('category_of_course');
            $table->boolean('is_published')->default(false);
            $table->timestamps();
        });
        
        // Create quizzes table
        Schema::create('quizzes', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->morphs('quizzable');
            $table->boolean('is_final')->default(false);
            $table->timestamps();
        });
        
        // Create questions table
        Schema::create('questions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('quiz_id')->constrained('quizzes');
            $table->text('question');
            $table->json('options');
            $table->string('correct_answer');
            $table->timestamps();
        });
        
        // Create user_courses table
        Schema::create('user_courses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users');
            $table->foreignId('course_id')->constrained('courses');
            $table->string('status')->default('in_progress');
            $table->decimal('final_exam_score', 5, 2)->nullable();
            $table->timestamps();
        });
        
        // Create user_category_enrollments table (needed by CategoryOfCourse model)
        Schema::create('user_category_enrollments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users');
            $table->foreignId('category_id')->constrained('category_of_course');
            $table->string('status')->default('active');
            $table->timestamps();
        });
    }

    /**
     * Test Case 1: Single Untestable Course
     * 
     * Diploma with 13 courses (1 with final exam with 0 questions)
     * Student completes all 12 testable courses
     * 
     * Expected on unfixed code: 12/13 = 92.31%
     * Expected on fixed code: 12/12 = 100%
     */
    public function test_single_untestable_course_shows_100_percent_when_all_testable_completed()
    {
        // Arrange: Create diploma with 13 courses
        $diploma = CategoryOfCourse::create([
            'name' => 'Test Diploma',
            'description' => 'Test diploma with one untestable course',
            'slug' => 'test-diploma'
        ]);

        $student = User::create([
            'name' => 'Test Student',
            'email' => 'student@test.com',
            'password' => bcrypt('password')
        ]);

        // Create 12 testable courses (with final exams that have questions)
        for ($i = 1; $i <= 12; $i++) {
            $course = Course::create([
                'title' => "Testable Course $i",
                'description' => 'A testable course',
                'category_id' => $diploma->id,
                'is_published' => true
            ]);

            // Create final exam with questions
            $finalExam = Quiz::create([
                'title' => "Final Exam - Testable Course $i",
                'is_final' => true,
                'quizzable_type' => Course::class,
                'quizzable_id' => $course->id
            ]);
            
            Question::create([
                'quiz_id' => $finalExam->id,
                'question' => 'Test question?',
                'options' => json_encode(['A' => 'Option A', 'B' => 'Option B']),
                'correct_answer' => 'A'
            ]);

            // Student completes this course with passing score
            UserCourse::create([
                'user_id' => $student->id,
                'course_id' => $course->id,
                'status' => 'completed',
                'final_exam_score' => 75
            ]);
        }

        // Create 1 untestable course (final exam with 0 questions)
        $untestableCourse = Course::create([
            'title' => 'Untestable Course',
            'description' => 'Course with final exam but no questions',
            'category_id' => $diploma->id,
            'is_published' => true
        ]);
        
        // Create final exam but with NO questions
        Quiz::create([
            'title' => 'Final Exam - Untestable Course',
            'is_final' => true,
            'quizzable_type' => Course::class,
            'quizzable_id' => $untestableCourse->id
        ]);

        // Act: Calculate completion percentage
        $percentage = $this->service->calculateCompletionPercentage($student, $diploma);

        // Assert: Should be 100% since student completed all testable courses
        // On unfixed code, this will be 92.31% (12/13)
        $this->assertEquals(
            100.0,
            $percentage,
            "Expected 100% completion when all testable courses are completed. " .
            "Got {$percentage}%. This indicates the bug: untestable courses are counted in denominator."
        );
    }

    /**
     * Test Case 2: Multiple Untestable Courses
     * 
     * Diploma with 10 courses (3 with final exams with 0 questions)
     * Student completes all 7 testable courses
     * 
     * Expected on unfixed code: 7/10 = 70%
     * Expected on fixed code: 7/7 = 100%
     */
    public function test_multiple_untestable_courses_shows_100_percent_when_all_testable_completed()
    {
        // Arrange: Create diploma with 10 courses
        $diploma = CategoryOfCourse::create([
            'name' => 'Test Diploma Multiple',
            'description' => 'Test diploma with multiple untestable courses',
            'slug' => 'test-diploma-multiple'
        ]);

        $student = User::create([
            'name' => 'Test Student 2',
            'email' => 'student2@test.com',
            'password' => bcrypt('password')
        ]);

        // Create 7 testable courses
        for ($i = 1; $i <= 7; $i++) {
            $course = Course::create([
                'title' => "Testable Course $i",
                'description' => 'A testable course',
                'category_id' => $diploma->id,
                'is_published' => true
            ]);

            $finalExam = Quiz::create([
                'title' => "Final Exam - Testable Course $i",
                'is_final' => true,
                'quizzable_type' => Course::class,
                'quizzable_id' => $course->id
            ]);
            
            Question::create([
                'quiz_id' => $finalExam->id,
                'question' => 'Test question?',
                'options' => json_encode(['A' => 'Option A', 'B' => 'Option B']),
                'correct_answer' => 'A'
            ]);

            UserCourse::create([
                'user_id' => $student->id,
                'course_id' => $course->id,
                'status' => 'completed',
                'final_exam_score' => 80
            ]);
        }

        // Create 3 untestable courses (final exams with 0 questions)
        for ($i = 1; $i <= 3; $i++) {
            $course = Course::create([
                'title' => "Untestable Course $i",
                'description' => 'Course with final exam but no questions',
                'category_id' => $diploma->id,
                'is_published' => true
            ]);
            
            Quiz::create([
                'title' => "Final Exam - Untestable Course $i",
                'is_final' => true,
                'quizzable_type' => Course::class,
                'quizzable_id' => $course->id
            ]);
        }

        // Act
        $percentage = $this->service->calculateCompletionPercentage($student, $diploma);

        // Assert: Should be 100%
        // On unfixed code, this will be 70% (7/10)
        $this->assertEquals(
            100.0,
            $percentage,
            "Expected 100% completion when all testable courses are completed. " .
            "Got {$percentage}%. Bug: 3 untestable courses counted in denominator."
        );
    }

    /**
     * Test Case 3: All Untestable Courses
     * 
     * Diploma with 3 courses (all have final exams with 0 questions)
     * Student has completed status
     * 
     * Expected on unfixed code: 0/3 = 0%
     * Expected on fixed code: 0/0 = 0% (division by zero handled)
     */
    public function test_all_untestable_courses_returns_zero_percent()
    {
        // Arrange: Create diploma with only untestable courses
        $diploma = CategoryOfCourse::create([
            'name' => 'All Untestable Diploma',
            'description' => 'Diploma with only untestable courses',
            'slug' => 'all-untestable-diploma'
        ]);

        $student = User::create([
            'name' => 'Test Student 3',
            'email' => 'student3@test.com',
            'password' => bcrypt('password')
        ]);

        // Create 3 untestable courses
        for ($i = 1; $i <= 3; $i++) {
            $course = Course::create([
                'title' => "Untestable Course $i",
                'description' => 'Course with final exam but no questions',
                'category_id' => $diploma->id,
                'is_published' => true
            ]);
            
            Quiz::create([
                'title' => "Final Exam - Untestable Course $i",
                'is_final' => true,
                'quizzable_type' => Course::class,
                'quizzable_id' => $course->id
            ]);
        }

        // Act
        $percentage = $this->service->calculateCompletionPercentage($student, $diploma);

        // Assert: Should be 0% (no testable courses to complete)
        $this->assertEquals(
            0.0,
            $percentage,
            "Expected 0% when diploma has no testable courses. Got {$percentage}%."
        );
    }

    /**
     * Test Case 4: Mixed Completion
     * 
     * Diploma with 10 courses (2 with final exams with 0 questions)
     * Student completes 5 of 8 testable courses
     * 
     * Expected on unfixed code: 5/10 = 50%
     * Expected on fixed code: 5/8 = 62.5%
     */
    public function test_mixed_completion_calculates_percentage_correctly()
    {
        // Arrange: Create diploma with 10 courses
        $diploma = CategoryOfCourse::create([
            'name' => 'Mixed Completion Diploma',
            'description' => 'Diploma with partial completion',
            'slug' => 'mixed-completion-diploma'
        ]);

        $student = User::create([
            'name' => 'Test Student 4',
            'email' => 'student4@test.com',
            'password' => bcrypt('password')
        ]);

        // Create 8 testable courses, student completes 5
        for ($i = 1; $i <= 8; $i++) {
            $course = Course::create([
                'title' => "Testable Course $i",
                'description' => 'A testable course',
                'category_id' => $diploma->id,
                'is_published' => true
            ]);

            $finalExam = Quiz::create([
                'title' => "Final Exam - Testable Course $i",
                'is_final' => true,
                'quizzable_type' => Course::class,
                'quizzable_id' => $course->id
            ]);
            
            Question::create([
                'quiz_id' => $finalExam->id,
                'question' => 'Test question?',
                'options' => json_encode(['A' => 'Option A', 'B' => 'Option B']),
                'correct_answer' => 'A'
            ]);

            // Only complete first 5 courses
            if ($i <= 5) {
                UserCourse::create([
                    'user_id' => $student->id,
                    'course_id' => $course->id,
                    'status' => 'completed',
                    'final_exam_score' => 70
                ]);
            }
        }

        // Create 2 untestable courses
        for ($i = 1; $i <= 2; $i++) {
            $course = Course::create([
                'title' => "Untestable Course $i",
                'description' => 'Course with final exam but no questions',
                'category_id' => $diploma->id,
                'is_published' => true
            ]);
            
            Quiz::create([
                'title' => "Final Exam - Untestable Course $i",
                'is_final' => true,
                'quizzable_type' => Course::class,
                'quizzable_id' => $course->id
            ]);
        }

        // Act
        $percentage = $this->service->calculateCompletionPercentage($student, $diploma);

        // Assert: Should be 62.5% (5/8)
        // On unfixed code, this will be 50% (5/10)
        $this->assertEquals(
            62.5,
            $percentage,
            "Expected 62.5% completion (5 of 8 testable courses). " .
            "Got {$percentage}%. Bug: 2 untestable courses counted in denominator."
        );
    }
}

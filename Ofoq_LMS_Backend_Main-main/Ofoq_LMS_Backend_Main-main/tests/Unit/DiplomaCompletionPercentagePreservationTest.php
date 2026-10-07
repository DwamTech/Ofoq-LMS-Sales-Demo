<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Models\User;
use App\Models\Course;
use App\Models\CategoryOfCourse;
use App\Models\UserCourse;
use App\Models\Quiz;
use App\Models\Question;
use App\Services\DiplomaEligibilityService;
use Illuminate\Foundation\Testing\RefreshDatabase;

/**
 * Preservation Property Tests for Diploma Completion Percentage
 * 
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6**
 * 
 * Property 2: Preservation - Non-Buggy Calculation Behavior
 * 
 * These tests verify that the fix does NOT break existing correct behavior.
 * Tests are run on UNFIXED code first to observe baseline behavior, then
 * after the fix to ensure preservation.
 * 
 * Expected Outcome: Tests PASS on both unfixed and fixed code
 */
class DiplomaCompletionPercentagePreservationTest extends TestCase
{
    use RefreshDatabase;

    private DiplomaEligibilityService $service;
    
    protected $seed = false;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->artisan('migrate', [
            '--path' => 'database/seeders/migrations',
        ]);
        
        $this->service = new DiplomaEligibilityService();
    }

    /**
     * Preservation Test 1: Courses Without Final Exams
     * 
     * **Validates: Requirement 3.1**
     * 
     * Verifies that courses without final exams are counted correctly
     * in the completion percentage calculation.
     */
    public function test_courses_without_final_exams_are_counted_correctly()
    {
        // Arrange: Create diploma with only courses without final exams
        $diploma = CategoryOfCourse::create([
            'name' => 'No Final Exams Diploma',
            'description' => 'Diploma with courses that have no final exams'
        ]);

        $student = User::create([
            'name' => 'Preservation Student 1',
            'email' => 'preservation1@test.com',
            'password' => bcrypt('password')
        ]);

        // Create 5 courses without final exams
        for ($i = 1; $i <= 5; $i++) {
            $course = Course::create([
                'title' => "No Final Exam Course $i",
                'description' => 'Course without final exam',
                'category_id' => $diploma->id,
                'is_published' => true
            ]);

            // Delete the auto-created final exam to simulate courses without final exams
            $course->finalExam()->delete();

            // Student completes 3 out of 5 courses
            if ($i <= 3) {
                UserCourse::create([
                    'user_id' => $student->id,
                    'course_id' => $course->id,
                    'status' => 'completed'
                ]);
            }
        }

        // Act
        $percentage = $this->service->calculateCompletionPercentage($student, $diploma);

        // Assert: Should be 60% (3/5)
        $this->assertEquals(
            60.0,
            $percentage,
            "Courses without final exams should be counted correctly. Expected 60% (3/5), got {$percentage}%"
        );
    }

    /**
     * Preservation Test 2: Courses With Final Exams That Have Questions
     * 
     * **Validates: Requirement 3.2**
     * 
     * Verifies that courses with final exams that have questions are counted
     * correctly when students achieve passing scores >= 60.
     */
    public function test_courses_with_final_exams_and_questions_are_counted_correctly()
    {
        // Arrange: Create diploma with courses that have final exams with questions
        $diploma = CategoryOfCourse::create([
            'name' => 'Final Exams With Questions Diploma',
            'description' => 'Diploma with courses that have final exams with questions'
        ]);

        $student = User::create([
            'name' => 'Preservation Student 2',
            'email' => 'preservation2@test.com',
            'password' => bcrypt('password')
        ]);

        // Create 8 courses with final exams that have questions
        for ($i = 1; $i <= 8; $i++) {
            $course = Course::create([
                'title' => "Final Exam Course $i",
                'description' => 'Course with final exam',
                'category_id' => $diploma->id,
                'is_published' => true
            ]);

            // Add questions to final exam
            $course->refresh(); // Refresh to get the auto-created final exam
            $finalExam = $course->finalExam;
            Question::create([
                'quiz_id' => $finalExam->id,
                'question' => 'Test question',
                'options' => ['A', 'B', 'C', 'D'],
                'correct_answer' => 'A'
            ]);

            // Student completes 6 out of 8 courses with passing scores
            if ($i <= 6) {
                UserCourse::create([
                    'user_id' => $student->id,
                    'course_id' => $course->id,
                    'status' => 'completed',
                    'final_exam_score' => 75
                ]);
            }
        }

        // Act
        $percentage = $this->service->calculateCompletionPercentage($student, $diploma);

        // Assert: Should be 75% (6/8)
        $this->assertEquals(
            75.0,
            $percentage,
            "Courses with final exams and questions should be counted correctly. Expected 75% (6/8), got {$percentage}%"
        );
    }

    /**
     * Preservation Test 3: Students With Failing Scores
     * 
     * **Validates: Requirement 3.3**
     * 
     * Verifies that students who have not achieved passing scores (< 60)
     * on final exams are excluded from the completed count.
     */
    public function test_students_with_failing_scores_are_excluded()
    {
        // Arrange
        $diploma = CategoryOfCourse::create([
            'name' => 'Failing Scores Diploma',
            'description' => 'Test failing score handling'
        ]);

        $student = User::create([
            'name' => 'Preservation Student 3',
            'email' => 'preservation3@test.com',
            'password' => bcrypt('password')
        ]);

        // Create 4 courses with final exams
        for ($i = 1; $i <= 4; $i++) {
            $course = Course::create([
                'title' => "Course $i",
                'description' => 'Course with final exam',
                'category_id' => $diploma->id,
                'is_published' => true
            ]);

            $course->refresh(); // Refresh to get the auto-created final exam
            $finalExam = $course->finalExam;
            Question::create([
                'quiz_id' => $finalExam->id,
                'question' => 'Test question',
                'options' => ['A', 'B', 'C', 'D'],
                'correct_answer' => 'A'
            ]);

            // 2 courses with passing scores, 2 with failing scores
            UserCourse::create([
                'user_id' => $student->id,
                'course_id' => $course->id,
                'status' => 'completed',
                'final_exam_score' => $i <= 2 ? 70 : 45  // First 2 pass, last 2 fail
            ]);
        }

        // Act
        $percentage = $this->service->calculateCompletionPercentage($student, $diploma);

        // Assert: Should be 50% (2/4) - only passing scores count
        $this->assertEquals(
            50.0,
            $percentage,
            "Students with failing scores should be excluded. Expected 50% (2/4), got {$percentage}%"
        );
    }

    /**
     * Preservation Test 4: Students With Non-Completed Status
     * 
     * **Validates: Requirement 3.6**
     * 
     * Verifies that students with status != 'completed' are excluded
     * from the completed count regardless of final exam status.
     */
    public function test_students_with_non_completed_status_are_excluded()
    {
        // Arrange
        $diploma = CategoryOfCourse::create([
            'name' => 'Non-Completed Status Diploma',
            'description' => 'Test non-completed status handling'
        ]);

        $student = User::create([
            'name' => 'Preservation Student 4',
            'email' => 'preservation4@test.com',
            'password' => bcrypt('password')
        ]);

        // Create 6 courses
        for ($i = 1; $i <= 6; $i++) {
            $course = Course::create([
                'title' => "Course $i",
                'description' => 'Course with final exam',
                'category_id' => $diploma->id,
                'is_published' => true
            ]);

            $course->refresh(); // Refresh to get the auto-created final exam
            $finalExam = $course->finalExam;
            Question::create([
                'quiz_id' => $finalExam->id,
                'question' => 'Test question',
                'options' => ['A', 'B', 'C', 'D'],
                'correct_answer' => 'A'
            ]);

            // 3 completed, 3 in-progress
            UserCourse::create([
                'user_id' => $student->id,
                'course_id' => $course->id,
                'status' => $i <= 3 ? 'completed' : 'in_progress',
                'final_exam_score' => 75
            ]);
        }

        // Act
        $percentage = $this->service->calculateCompletionPercentage($student, $diploma);

        // Assert: Should be 50% (3/6) - only completed courses count
        $this->assertEquals(
            50.0,
            $percentage,
            "Students with non-completed status should be excluded. Expected 50% (3/6), got {$percentage}%"
        );
    }

    /**
     * Preservation Test 5: Empty Diploma
     * 
     * **Validates: Requirement 3.4**
     * 
     * Verifies that when a diploma has zero courses, the system
     * returns 0.0 as the completion percentage.
     */
    public function test_empty_diploma_returns_zero()
    {
        // Arrange: Create diploma with no courses
        $diploma = CategoryOfCourse::create([
            'name' => 'Empty Diploma',
            'description' => 'Diploma with no courses'
        ]);

        $student = User::create([
            'name' => 'Preservation Student 5',
            'email' => 'preservation5@test.com',
            'password' => bcrypt('password')
        ]);

        // Act
        $percentage = $this->service->calculateCompletionPercentage($student, $diploma);

        // Assert: Should be 0.0
        $this->assertEquals(
            0.0,
            $percentage,
            "Empty diploma should return 0.0. Got {$percentage}%"
        );
    }

    /**
     * Preservation Test 6: Two Decimal Precision
     * 
     * **Validates: Requirement 3.5**
     * 
     * Verifies that completion percentage is rounded to 2 decimal places.
     */
    public function test_result_is_rounded_to_two_decimal_places()
    {
        // Arrange: Create scenario that produces non-round percentage
        $diploma = CategoryOfCourse::create([
            'name' => 'Precision Test Diploma',
            'description' => 'Test decimal precision'
        ]);

        $student = User::create([
            'name' => 'Preservation Student 6',
            'email' => 'preservation6@test.com',
            'password' => bcrypt('password')
        ]);

        // Create 3 courses, complete 1 (should be 33.33%)
        for ($i = 1; $i <= 3; $i++) {
            $course = Course::create([
                'title' => "Course $i",
                'description' => 'Course with final exam',
                'category_id' => $diploma->id,
                'is_published' => true
            ]);

            $course->refresh(); // Refresh to get the auto-created final exam
            $finalExam = $course->finalExam;
            Question::create([
                'quiz_id' => $finalExam->id,
                'question' => 'Test question',
                'options' => ['A', 'B', 'C', 'D'],
                'correct_answer' => 'A'
            ]);

            if ($i === 1) {
                UserCourse::create([
                    'user_id' => $student->id,
                    'course_id' => $course->id,
                    'status' => 'completed',
                    'final_exam_score' => 80
                ]);
            }
        }

        // Act
        $percentage = $this->service->calculateCompletionPercentage($student, $diploma);

        // Assert: Should be 33.33 (rounded to 2 decimals)
        $this->assertEquals(
            33.33,
            $percentage,
            "Result should be rounded to 2 decimal places. Expected 33.33, got {$percentage}"
        );
    }

    /**
     * Preservation Test 7: Mixed Course Types
     * 
     * **Validates: Requirements 3.1, 3.2**
     * 
     * Verifies correct calculation when diploma has both courses with
     * and without final exams (but NO courses with 0-question exams).
     */
    public function test_mixed_course_types_without_untestable_courses()
    {
        // Arrange: Mix of courses with and without final exams
        $diploma = CategoryOfCourse::create([
            'name' => 'Mixed Types Diploma',
            'description' => 'Mix of course types'
        ]);

        $student = User::create([
            'name' => 'Preservation Student 7',
            'email' => 'preservation7@test.com',
            'password' => bcrypt('password')
        ]);

        // Create 3 courses without final exams
        for ($i = 1; $i <= 3; $i++) {
            $course = Course::create([
                'title' => "No Exam Course $i",
                'description' => 'Course without final exam',
                'category_id' => $diploma->id,
                'is_published' => true
            ]);

            $course->finalExam()->delete();

            // Complete all 3
            UserCourse::create([
                'user_id' => $student->id,
                'course_id' => $course->id,
                'status' => 'completed'
            ]);
        }

        // Create 2 courses with final exams (with questions)
        for ($i = 1; $i <= 2; $i++) {
            $course = Course::create([
                'title' => "Exam Course $i",
                'description' => 'Course with final exam',
                'category_id' => $diploma->id,
                'is_published' => true
            ]);

            $course->refresh(); // Refresh to get the auto-created final exam
            $finalExam = $course->finalExam;
            Question::create([
                'quiz_id' => $finalExam->id,
                'question' => 'Test question',
                'options' => ['A', 'B', 'C', 'D'],
                'correct_answer' => 'A'
            ]);

            // Complete 1 out of 2
            if ($i === 1) {
                UserCourse::create([
                    'user_id' => $student->id,
                    'course_id' => $course->id,
                    'status' => 'completed',
                    'final_exam_score' => 85
                ]);
            }
        }

        // Act
        $percentage = $this->service->calculateCompletionPercentage($student, $diploma);

        // Assert: Should be 80% (4/5)
        $this->assertEquals(
            80.0,
            $percentage,
            "Mixed course types should calculate correctly. Expected 80% (4/5), got {$percentage}%"
        );
    }

    /**
     * Preservation Test 8: Student With No Completed Courses
     * 
     * **Validates: Requirements 3.3, 3.6**
     * 
     * Verifies that when a student has not completed any courses,
     * the completion percentage is 0%.
     */
    public function test_student_with_no_completed_courses_returns_zero()
    {
        // Arrange
        $diploma = CategoryOfCourse::create([
            'name' => 'No Completion Diploma',
            'description' => 'Student has not completed any courses'
        ]);

        $student = User::create([
            'name' => 'Preservation Student 8',
            'email' => 'preservation8@test.com',
            'password' => bcrypt('password')
        ]);

        // Create 5 courses with final exams
        for ($i = 1; $i <= 5; $i++) {
            $course = Course::create([
                'title' => "Course $i",
                'description' => 'Course with final exam',
                'category_id' => $diploma->id,
                'is_published' => true
            ]);

            $course->refresh(); // Refresh to get the auto-created final exam
            $finalExam = $course->finalExam;
            Question::create([
                'quiz_id' => $finalExam->id,
                'question' => 'Test question',
                'options' => ['A', 'B', 'C', 'D'],
                'correct_answer' => 'A'
            ]);

            // Student enrolled but not completed
            UserCourse::create([
                'user_id' => $student->id,
                'course_id' => $course->id,
                'status' => 'in_progress',
                'final_exam_score' => null
            ]);
        }

        // Act
        $percentage = $this->service->calculateCompletionPercentage($student, $diploma);

        // Assert: Should be 0%
        $this->assertEquals(
            0.0,
            $percentage,
            "Student with no completed courses should have 0%. Got {$percentage}%"
        );
    }

    /**
     * Preservation Test 9: All Courses Completed (100%)
     * 
     * **Validates: Requirements 3.1, 3.2, 3.5**
     * 
     * Verifies that when a student completes all testable courses,
     * the system returns exactly 100.0.
     */
    public function test_all_courses_completed_returns_exactly_100_percent()
    {
        // Arrange
        $diploma = CategoryOfCourse::create([
            'name' => 'Full Completion Diploma',
            'description' => 'All courses completed'
        ]);

        $student = User::create([
            'name' => 'Preservation Student 9',
            'email' => 'preservation9@test.com',
            'password' => bcrypt('password')
        ]);

        // Create 10 courses with final exams
        for ($i = 1; $i <= 10; $i++) {
            $course = Course::create([
                'title' => "Course $i",
                'description' => 'Course with final exam',
                'category_id' => $diploma->id,
                'is_published' => true
            ]);

            $course->refresh(); // Refresh to get the auto-created final exam
            $finalExam = $course->finalExam;
            Question::create([
                'quiz_id' => $finalExam->id,
                'question' => 'Test question',
                'options' => ['A', 'B', 'C', 'D'],
                'correct_answer' => 'A'
            ]);

            // Complete all courses
            UserCourse::create([
                'user_id' => $student->id,
                'course_id' => $course->id,
                'status' => 'completed',
                'final_exam_score' => 90
            ]);
        }

        // Act
        $percentage = $this->service->calculateCompletionPercentage($student, $diploma);

        // Assert: Should be exactly 100.0
        $this->assertEquals(
            100.0,
            $percentage,
            "All courses completed should return exactly 100.0. Got {$percentage}%"
        );
    }
}

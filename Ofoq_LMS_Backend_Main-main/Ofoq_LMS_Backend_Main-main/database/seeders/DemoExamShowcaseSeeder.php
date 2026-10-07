<?php

namespace Database\Seeders;

use App\Models\Course;
use App\Models\CourseCertificate;
use App\Models\Quiz;
use App\Models\User;
use App\Models\UserCourse;
use App\Models\UserLessonProgress;
use App\Models\UserQuizAttempt;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use RuntimeException;

/**
 * Prepares one additional, eligible final-exam course for the Demo Student.
 *
 * This seeder deliberately leaves existing certificates, watch data, favourites,
 * and every other enrollment untouched. Its one active final-exam attempt exists
 * only so the read-only Demo UI can render the existing question bank without
 * needing to POST /start.
 */
class DemoExamShowcaseSeeder extends Seeder
{
    private const STUDENT_EMAIL = 'student.demo@demo.ofoq.local';

    // Existing DemoSalesSeeder course: "قواعد البيانات باستخدام Python".
    private const SHOWCASE_COURSE_ID = 7;

    public function run(): void
    {
        $student = User::query()
            ->where('email', self::STUDENT_EMAIL)
            ->firstOrFail();

        $course = Course::withoutGlobalScopes()->findOrFail(self::SHOWCASE_COURSE_ID);

        if (CourseCertificate::query()
            ->where('user_id', $student->id)
            ->where('course_id', $course->id)
            ->exists()) {
            throw new RuntimeException('The Demo exam showcase course already has a certificate. Choose a certificate-free course.');
        }

        $finalExam = Quiz::query()
            ->where('quizzable_type', Course::class)
            ->where('quizzable_id', $course->id)
            ->where('is_final', true)
            ->firstOrFail();

        $questionsCount = $finalExam->questions()->count();
        if ($questionsCount < 1) {
            throw new RuntimeException('The Demo exam showcase course must already have final-exam questions.');
        }

        $lessons = $course->lessons()
            ->orderBy('chapters.order')
            ->orderBy('lessons.order')
            ->get();

        if ($lessons->isEmpty()) {
            throw new RuntimeException('The Demo exam showcase course must already have lessons.');
        }

        // Do not overwrite real or pre-existing submitted/cancelled history just to
        // manufacture a demo state. A prior showcase in-progress attempt is reused.
        if (UserQuizAttempt::query()
            ->where('user_id', $student->id)
            ->where('quiz_id', $finalExam->id)
            ->where('status', '!=', 'in_progress')
            ->exists()) {
            throw new RuntimeException('The Demo exam showcase course already has final-exam attempt history.');
        }

        DB::transaction(function () use ($student, $course, $finalExam, $lessons): void {
            $completedAt = now();

            // Final-exam eligibility in FinalExamController is based on this status.
            UserCourse::updateOrCreate(
                [
                    'user_id' => $student->id,
                    'course_id' => $course->id,
                ],
                [
                    'status' => 'completed',
                    'progress_percentage' => 100,
                    'final_exam_score' => null,
                    'completed_at' => $completedAt,
                ]
            );

            foreach ($lessons as $index => $lesson) {
                $lessonCompletedAt = $completedAt->copy()->subMinutes($lessons->count() - $index);

                UserLessonProgress::updateOrCreate(
                    [
                        'user_id' => $student->id,
                        'lesson_id' => $lesson->id,
                    ],
                    [
                        'status' => 'completed',
                        'quiz_passed' => true,
                        'started_at' => $lessonCompletedAt->copy()->subMinute(),
                        'completed_at' => $lessonCompletedAt,
                        'progress_percentage' => 100,
                        'watch_duration_seconds' => 0,
                        'last_watched_at' => $lessonCompletedAt,
                        'first_started_at' => $lessonCompletedAt->copy()->subMinute(),
                        'completed_by' => 'manual',
                        'completion_source' => 'manual',
                        'last_position_seconds' => 0,
                    ]
                );
            }

            $attempt = UserQuizAttempt::firstOrCreate(
                [
                    'user_id' => $student->id,
                    'quiz_id' => $finalExam->id,
                    'status' => 'in_progress',
                ],
                [
                    'start_time' => $completedAt,
                    'score' => null,
                    'total_questions' => null,
                    'correct_answers' => null,
                    'answers' => null,
                    'time_taken' => null,
                    'passed' => false,
                ]
            );

            // activeAttempt() reads questions from this pivot, not directly from Quiz.
            $attempt->questions()->syncWithoutDetaching(
                $finalExam->questions()->pluck('id')->all()
            );
        });

        $this->command?->info(sprintf(
            'Demo final-exam showcase prepared: course #%d, %d/%d lessons complete, final quiz #%d with %d questions and one in-progress attempt.',
            $course->id,
            $lessons->count(),
            $lessons->count(),
            $finalExam->id,
            $questionsCount,
        ));
    }
}

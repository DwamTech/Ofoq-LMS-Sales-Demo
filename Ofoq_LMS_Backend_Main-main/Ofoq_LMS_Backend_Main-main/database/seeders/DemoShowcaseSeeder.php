<?php

namespace Database\Seeders;

use App\Models\CategoryOfCourse;
use App\Models\Course;
use App\Models\CourseCertificate;
use App\Models\DiplomaCertificate;
use App\Models\Lesson;
use App\Models\User;
use App\Models\UserCategoryEnrollment;
use App\Models\UserCourse;
use App\Models\UserLessonProgress;
use App\Models\UserQuizAttempt;
use App\Services\DemoCertificatePdfService;
use App\Support\DemoEnvironmentGuard;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use RuntimeException;

/**
 * Curates one deterministic student story for the local sales demo.
 *
 * It never touches users outside student.demo@demo.ofoq.local and only
 * unpublishes redundant diplomas carrying DemoSalesSeeder's own marker.
 */
class DemoShowcaseSeeder extends Seeder
{
    private const MARKER = 'OFOQ Sales Demo dataset';
    private const STUDENT_EMAIL = 'student.demo@demo.ofoq.local';
    private const PRIMARY_DIPLOMA = 'دبلومة البرمجة بلغة Python';
    private const SECONDARY_DIPLOMA = 'دبلومة تطوير الويب الشامل';
    private const COMPLETED_PRIMARY_COURSE = 'البرمجة الكائنية في Python';
    private const EXAM_PRIMARY_COURSE = 'قواعد البيانات باستخدام Python';

    public function run(): void
    {
        DemoEnvironmentGuard::assertLocalDemo();

        // The larger 800-student sales dataset is a bootstrap fixture. Once
        // its marker-scoped catalogue is present, do not rerun it during a
        // showcase repair: that preserves existing aggregate demo reporting.
        if (! CategoryOfCourse::query()->where('description', 'like', '%'.self::MARKER.'%')->exists()) {
            $this->call(DemoSalesSeeder::class);
        }

        $this->call([
            DemoAccountsSeeder::class,
            DemoExamShowcaseSeeder::class,
        ]);

        $student = User::query()->where('email', self::STUDENT_EMAIL)->firstOrFail();
        $student->forceFill([
            'name' => 'ليان أحمد الكيلاني',
            'nationality' => 'مصر',
            'qualification' => 'بكالوريوس علوم الحاسب',
            'media_work_sector' => 'التعليم والتقنية',
        ])->save();

        [$primary, $secondary] = DB::transaction(function () use ($student) {
            $primary = $this->canonicalDiploma(self::PRIMARY_DIPLOMA);
            $secondary = $this->canonicalDiploma(self::SECONDARY_DIPLOMA);

            $this->unpublishRedundantDemoDiplomas($student);

            $primaryCourses = $primary->courses()->withoutGlobalScopes()->orderBy('id')->get();
            $secondaryCourses = $secondary->courses()->withoutGlobalScopes()->orderBy('id')->get();

            if ($primaryCourses->count() < 4 || $secondaryCourses->count() < 4) {
                throw new RuntimeException('The canonical demo diplomas must each have their real course relationships.');
            }

            $this->upsertDiplomaEnrollment($student, $primary, null);
            $this->upsertDiplomaEnrollment($student, $secondary, now()->subDays(14));

            $completedPrimary = $primaryCourses->firstWhere('title', self::COMPLETED_PRIMARY_COURSE);
            $examPrimary = $primaryCourses->firstWhere('title', self::EXAM_PRIMARY_COURSE);

            if (! $completedPrimary || ! $examPrimary) {
                throw new RuntimeException('The primary diploma is missing the designated completed or exam showcase course.');
            }

            foreach ($primaryCourses as $course) {
                if ($course->is($completedPrimary)) {
                    $this->setCourseJourney($student, $course, 100, 'completed', 83.33, now()->subDays(16));
                    $this->ensureSubmittedAttempt($student, $course, 83.33);
                } elseif ($course->is($examPrimary)) {
                    // Content is complete, but the final exam remains in progress;
                    // this course is deliberately not academically completed.
                    $this->setCourseJourney($student, $course, 100, 'active', null, null);
                    $this->ensureInProgressAttempt($student, $course);
                } elseif ($course->title === 'أساسيات البرمجة بلغة Python') {
                    $this->setCourseJourney($student, $course, 50, 'active', null, null);
                } else {
                    $this->setCourseJourney($student, $course, 0, 'active', null, null);
                }
            }

            foreach ($secondaryCourses as $index => $course) {
                // Scores are derived from the actual six-question attempts,
                // rather than storing a value that contradicts the answers.
                $score = [100.0, 83.33, 66.67, 100.0][$index % 4];
                $this->setCourseJourney($student, $course, 100, 'completed', $score, now()->subDays(14 - $index));
                $this->ensureSubmittedAttempt($student, $course, $score);
            }

            return [$primary, $secondary];
        });

        $completedPrimary = $primary->courses()->withoutGlobalScopes()
            ->where('title', self::COMPLETED_PRIMARY_COURSE)
            ->firstOrFail();

        $courseCertificate = $this->prepareCourseCertificate($student, $completedPrimary);
        $diplomaCertificate = $this->prepareDiplomaCertificate($student, $secondary);

        $pdfs = app(DemoCertificatePdfService::class);

        // Keep records pending until their corresponding real PDF has been
        // written and independently verified in public storage.
        $courseCertificate->update(['status' => 'pending', 'file_path' => null]);
        $coursePath = $pdfs->generateCourse($courseCertificate->fresh());
        $courseCertificate->update(['status' => 'completed', 'file_path' => $coursePath]);

        $diplomaCertificate->update(['status' => 'pending', 'file_path' => null]);
        $diplomaPath = $pdfs->generateDiploma($diplomaCertificate->fresh());
        $diplomaCertificate->update(['status' => 'completed', 'file_path' => $diplomaPath]);
    }

    private function canonicalDiploma(string $name): CategoryOfCourse
    {
        return CategoryOfCourse::query()
            ->where('name', $name)
            ->where('description', 'like', '%'.self::MARKER.'%')
            ->withCount('courses')
            ->orderByDesc('courses_count')
            ->orderBy('id')
            ->firstOrFail();
    }

    private function unpublishRedundantDemoDiplomas(User $student): void
    {
        CategoryOfCourse::query()
            ->where('description', 'like', '%'.self::MARKER.'%')
            ->withCount(['courses', 'enrollments', 'certificates'])
            ->get()
            ->groupBy('name')
            ->each(function ($diplomas) use ($student): void {
                $canonical = $diplomas
                    ->sortBy(fn (CategoryOfCourse $diploma) => sprintf('%010d-%010d', -$diploma->courses_count, $diploma->id))
                    ->first();

                foreach ($diplomas as $diploma) {
                    if ($diploma->is($canonical) || $diploma->courses_count > 0) {
                        continue;
                    }

                    // These are marker-scoped empty duplicates. Unpublishing
                    // preserves all history while removing them from the API.
                    if ($diploma->is_published) {
                        $diploma->update(['is_published' => false]);
                    }

                    // The designated showcase student may have one orphaned
                    // enrollment from an older buggy seed run. It has no
                    // courses or certificate and points at an empty, now
                    // unpublished demo duplicate, so removing this one exact
                    // demo-only join restores a coherent student journey.
                    UserCategoryEnrollment::query()
                        ->where('user_id', $student->id)
                        ->where('category_id', $diploma->id)
                        ->whereDoesntHave('category.courses')
                        ->whereDoesntHave('category.certificates')
                        ->each(fn (UserCategoryEnrollment $enrollment) => $enrollment->delete());
                }
            });
    }

    private function upsertDiplomaEnrollment(User $student, CategoryOfCourse $diploma, $completedAt): UserCategoryEnrollment
    {
        $enrollment = UserCategoryEnrollment::query()
            ->where('user_id', $student->id)
            ->where('category_id', $diploma->id)
            ->first();

        if (! $enrollment) {
            $enrollment = new UserCategoryEnrollment([
                'user_id' => $student->id,
                'category_id' => $diploma->id,
            ]);
        }

        // "active" is the platform's access state. Academic completion is
        // derived from the individual courses by DiplomaCompletionService.
        $enrollment->status = 'active';
        $enrollment->completed_at = $completedAt;
        $enrollment->save();

        return $enrollment;
    }

    private function setCourseJourney(User $student, Course $course, float $targetProgress, string $status, ?float $score, $completedAt): void
    {
        $lessons = Lesson::query()
            ->whereHas('chapter', fn ($query) => $query->where('course_id', $course->id))
            ->with('chapter:id,order')
            ->orderBy('chapter_id')
            ->orderBy('order')
            ->get();

        if ($lessons->isEmpty()) {
            throw new RuntimeException("Course {$course->id} has no lessons and cannot carry a coherent progress story.");
        }

        $completedCount = (int) round($lessons->count() * ($targetProgress / 100));
        $actualProgress = round(($completedCount / $lessons->count()) * 100, 2);
        $startedAt = now()->subDays(21);

        foreach ($lessons as $index => $lesson) {
            $existing = UserLessonProgress::query()
                ->where('user_id', $student->id)
                ->where('lesson_id', $lesson->id)
                ->first();

            if ($index < $completedCount) {
                UserLessonProgress::updateOrCreate(
                    ['user_id' => $student->id, 'lesson_id' => $lesson->id],
                    [
                        'status' => 'completed',
                        'quiz_passed' => true,
                        'progress_percentage' => 100,
                        'started_at' => $startedAt->copy()->addDays($index),
                        'first_started_at' => $startedAt->copy()->addDays($index),
                        'last_watched_at' => $startedAt->copy()->addDays($index),
                        'completed_at' => $startedAt->copy()->addDays($index + 1),
                        'completed_by' => 'demo_seed',
                        'completion_source' => 'demo_seed',
                        'watch_duration_seconds' => max(1, (int) ($lesson->duration_seconds ?? 600)),
                        'last_position_seconds' => max(1, (int) ($lesson->duration_seconds ?? 600)),
                    ]
                );
            } elseif ($existing) {
                // Do not delete old demo progress rows; normalize an existing
                // row so stored completion still matches course progress.
                $existing->update([
                    'status' => 'in_progress',
                    'quiz_passed' => false,
                    'progress_percentage' => 0,
                    'completed_at' => null,
                    'completed_by' => null,
                    'completion_source' => null,
                ]);
            }
        }

        UserCourse::updateOrCreate(
            ['user_id' => $student->id, 'course_id' => $course->id],
            [
                'status' => $status,
                'progress_percentage' => $actualProgress,
                'final_exam_score' => $score,
                'completed_at' => $completedAt,
            ]
        );
    }

    private function ensureSubmittedAttempt(User $student, Course $course, float $score): void
    {
        $quiz = $course->finalExam()->with('questions')->first();
        if (! $quiz || $quiz->questions->isEmpty()) {
            throw new RuntimeException("Course {$course->id} needs a final exam with questions for a completed demo journey.");
        }

        $questionCount = $quiz->questions->count();
        $correctCount = max(0, min($questionCount, (int) round($questionCount * ($score / 100))));
        $actualScore = round(($correctCount / $questionCount) * 100, 2);

        $answers = $quiz->questions->values()->map(function ($question, int $index) use ($correctCount) {
            $correct = array_map('intval', (array) $question->correct_answer);

            if ($index < $correctCount) {
                $selected = $correct;
            } else {
                $options = array_keys((array) $question->options);
                $selected = [collect($options)->map(fn ($option) => (int) $option)->first(fn (int $option) => ! in_array($option, $correct, true)) ?? $correct[0]];
            }

            return [
                'question_id' => $question->id,
                'selected_indices' => $selected,
            ];
        })->all();

        $attempt = UserQuizAttempt::query()
            ->where('user_id', $student->id)
            ->where('quiz_id', $quiz->id)
            ->orderBy('id')
            ->first() ?? new UserQuizAttempt(['user_id' => $student->id, 'quiz_id' => $quiz->id]);

        $attempt->fill([
            'status' => 'submitted',
            'score' => $actualScore,
            'total_questions' => $questionCount,
            'correct_answers' => $correctCount,
            'answers' => json_encode($answers),
            'time_taken' => 720,
            'passed' => true,
            'start_time' => $attempt->start_time ?? now()->subDays(15),
        ]);
        $attempt->save();
        $attempt->questions()->sync($quiz->questions->pluck('id')->all());
    }

    private function ensureInProgressAttempt(User $student, Course $course): void
    {
        $quiz = $course->finalExam()->with('questions')->first();
        if (! $quiz || $quiz->questions->isEmpty()) {
            throw new RuntimeException("Course {$course->id} needs a final exam with questions for the read-only showcase.");
        }

        if (CourseCertificate::query()->where('user_id', $student->id)->where('course_id', $course->id)->exists()) {
            throw new RuntimeException('The read-only final-exam showcase course already has a certificate.');
        }

        $attempt = UserQuizAttempt::query()
            ->where('user_id', $student->id)
            ->where('quiz_id', $quiz->id)
            ->where('status', 'in_progress')
            ->first() ?? new UserQuizAttempt(['user_id' => $student->id, 'quiz_id' => $quiz->id]);

        $attempt->fill([
            'status' => 'in_progress',
            'score' => null,
            'total_questions' => null,
            'correct_answers' => null,
            'answers' => null,
            'time_taken' => null,
            'passed' => false,
            'start_time' => $attempt->start_time ?? now()->subDays(2),
        ]);
        $attempt->save();
        $attempt->questions()->sync($quiz->questions->pluck('id')->all());
    }

    private function prepareCourseCertificate(User $student, Course $course): CourseCertificate
    {
        $certificate = CourseCertificate::query()
            ->where('user_id', $student->id)
            ->where('course_id', $course->id)
            ->first() ?? new CourseCertificate(['user_id' => $student->id, 'course_id' => $course->id]);

        $certificate->fill([
            'serial_number' => $certificate->serial_number ?: 'DEMO-C-PY-OOP-001',
            'verification_token' => $certificate->verification_token ?: (string) Str::uuid(),
            'certificate_data' => [
                'user_name' => $student->name,
                'course_title' => $course->title,
                'completion_date' => now()->subDays(16)->toDateString(),
            ],
        ]);
        $certificate->save();

        return $certificate;
    }

    private function prepareDiplomaCertificate(User $student, CategoryOfCourse $diploma): DiplomaCertificate
    {
        $enrollment = UserCategoryEnrollment::query()
            ->where('user_id', $student->id)
            ->where('category_id', $diploma->id)
            ->firstOrFail();

        $certificate = DiplomaCertificate::query()
            ->where('user_id', $student->id)
            ->where('diploma_id', $diploma->id)
            ->first() ?? new DiplomaCertificate(['user_id' => $student->id, 'diploma_id' => $diploma->id]);

        $certificate->fill([
            'student_name' => $student->name,
            'user_category_enrollment_id' => $enrollment->id,
            'serial_number' => $certificate->serial_number ?: 'DEMO-D-WEB-001',
            'verification_token' => $certificate->verification_token ?: (string) Str::uuid(),
            'issued_at' => now()->subDays(14),
            'certificate_data' => [
                'user_name' => $student->name,
                'diploma_name' => $diploma->name,
                'completion_date' => now()->subDays(14)->toDateString(),
            ],
        ]);
        $certificate->save();

        return $certificate;
    }
}

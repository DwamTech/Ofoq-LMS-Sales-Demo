<?php

namespace App\Console\Commands;

use App\Http\Middleware\EnsureDemoIsReadOnly;
use App\Models\CategoryOfCourse;
use App\Models\Course;
use App\Models\CourseCertificate;
use App\Models\DiplomaCertificate;
use App\Models\Lesson;
use App\Models\User;
use App\Models\UserCategoryEnrollment;
use App\Models\UserCourse;
use App\Models\UserLessonProgress;
use App\Services\DemoCertificatePdfService;
use App\Services\DiplomaCompletionService;
use App\Support\DemoEnvironmentGuard;
use Illuminate\Console\Command;
use Illuminate\Contracts\Http\Kernel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use RuntimeException;

class DemoShowcaseHealthCheck extends Command
{
    private const MARKER = 'OFOQ Sales Demo dataset';
    private const STUDENT_EMAIL = 'student.demo@demo.ofoq.local';
    private const ADMIN_EMAIL = 'admin.demo@demo.ofoq.local';
    private const PRIMARY_DIPLOMA = 'دبلومة البرمجة بلغة Python';
    private const SECONDARY_DIPLOMA = 'دبلومة تطوير الويب الشامل';
    private const COMPLETED_COURSE = 'البرمجة الكائنية في Python';
    private const EXAM_COURSE = 'قواعد البيانات باستخدام Python';

    protected $signature = 'demo:health-check {--json : Emit the assertions as JSON}';

    protected $description = 'Validate the Ofoq demo story, certificate artifacts, and demo read-only contract.';

    public function handle(DemoCertificatePdfService $pdfs, DiplomaCompletionService $completion): int
    {
        try {
            DemoEnvironmentGuard::assertLocalDemo();
            $checks = $this->checks($pdfs, $completion);
        } catch (RuntimeException|\LogicException $exception) {
            $this->error($exception->getMessage());

            return self::FAILURE;
        }

        if ($this->option('json')) {
            $this->line(json_encode($checks, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
        } else {
            $this->table(['Check', 'Result'], collect($checks)
                ->map(fn (bool $passed, string $check) => [$check, $passed ? 'PASS' : 'FAIL'])
                ->values()
                ->all());
        }

        $failed = collect($checks)->filter(fn (bool $passed) => ! $passed)->count();
        $this->line(sprintf('Demo health: %d PASS, %d FAIL.', count($checks) - $failed, $failed));

        return $failed === 0 ? self::SUCCESS : self::FAILURE;
    }

    /** @return array<string, bool> */
    private function checks(DemoCertificatePdfService $pdfs, DiplomaCompletionService $completion): array
    {
        $student = User::where('email', self::STUDENT_EMAIL)->first();
        $admin = User::where('email', self::ADMIN_EMAIL)->first();
        $primary = $this->diploma(self::PRIMARY_DIPLOMA);
        $secondary = $this->diploma(self::SECONDARY_DIPLOMA);
        $primaryCourses = $primary?->courses()->withoutGlobalScopes()->get() ?? collect();
        $secondaryCourses = $secondary?->courses()->withoutGlobalScopes()->get() ?? collect();
        $completedCourse = $primaryCourses->firstWhere('title', self::COMPLETED_COURSE);
        $examCourse = $primaryCourses->firstWhere('title', self::EXAM_COURSE);
        $primaryEnrollment = $student && $primary
            ? UserCategoryEnrollment::where('user_id', $student->id)->where('category_id', $primary->id)->first()
            : null;
        $secondaryEnrollment = $student && $secondary
            ? UserCategoryEnrollment::where('user_id', $student->id)->where('category_id', $secondary->id)->first()
            : null;
        $courseCertificate = $student && $completedCourse
            ? CourseCertificate::where('user_id', $student->id)->where('course_id', $completedCourse->id)->first()
            : null;
        $diplomaCertificate = $student && $secondary
            ? DiplomaCertificate::where('user_id', $student->id)->where('diploma_id', $secondary->id)->first()
            : null;

        $secondaryState = $secondaryEnrollment
            ? $completion->forEnrollments(collect([$secondaryEnrollment]))->get($secondaryEnrollment->id)
            : null;

        return [
            'canonical_showcase_student_exists' => (bool) $student,
            'primary_diploma_is_public_and_linked' => (bool) ($primary?->is_published && $primaryCourses->isNotEmpty()),
            'student_diploma_and_course_enrollments_are_coherent' => $this->hasAllCourseEnrollments($student, $primaryCourses)
                && $this->hasAllCourseEnrollments($student, $secondaryCourses)
                && $primaryEnrollment?->status === 'active'
                && $secondaryEnrollment?->status === 'active',
            'stored_lesson_progress_matches_course_progress' => $this->progressIsCoherent($student, $primaryCourses->merge($secondaryCourses)),
            'completed_course_has_legitimate_issued_certificate' => $this->courseCertificateIsValid($student, $completedCourse, $courseCertificate, $pdfs),
            'secondary_diploma_completion_is_legitimate' => (bool) ($secondaryState['completed'] ?? false),
            'diploma_certificate_is_legitimate_and_issued' => $this->diplomaCertificateIsValid($diplomaCertificate, $pdfs),
            'both_pdf_artifacts_are_readable' => $pdfs->isReadablePdf($courseCertificate?->file_path)
                && $pdfs->isReadablePdf($diplomaCertificate?->file_path),
            'public_verification_paths_serve_pdf' => $this->verificationPathsServePdf($courseCertificate, $diplomaCertificate),
            'final_exam_questions_and_choices_are_available_read_only' => $this->finalExamIsAvailable($examCourse),
            'no_unexpected_duplicate_public_demo_diplomas_remain' => $this->hasNoPublicDemoDuplicates(),
            'student_and_admin_read_only_get_endpoints_are_functional' => $this->authenticatedGet($student, '/api/my-diplomas')
                && $this->authenticatedGet($admin, '/api/admin/courses'),
            'demo_mode_blocks_mutating_http_requests' => $this->mutationIsBlocked(),
        ];
    }

    private function diploma(string $name): ?CategoryOfCourse
    {
        return CategoryOfCourse::where('name', $name)
            ->where('description', 'like', '%'.self::MARKER.'%')
            ->withCount('courses')
            ->orderByDesc('courses_count')
            ->orderBy('id')
            ->first();
    }

    private function hasAllCourseEnrollments(?User $student, $courses): bool
    {
        if (! $student || $courses->isEmpty()) {
            return false;
        }

        return UserCourse::where('user_id', $student->id)
            ->whereIn('course_id', $courses->pluck('id'))
            ->count() === $courses->count();
    }

    private function progressIsCoherent(?User $student, $courses): bool
    {
        if (! $student || $courses->isEmpty()) {
            return false;
        }

        return $courses->every(function (Course $course) use ($student): bool {
            $courseEnrollment = UserCourse::where('user_id', $student->id)->where('course_id', $course->id)->first();
            $lessonIds = Lesson::whereHas('chapter', fn ($query) => $query->where('course_id', $course->id))->pluck('id');

            if (! $courseEnrollment || $lessonIds->isEmpty()) {
                return false;
            }

            $completed = UserLessonProgress::where('user_id', $student->id)
                ->whereIn('lesson_id', $lessonIds)
                ->where('status', 'completed')
                ->count();
            $expected = round(($completed / $lessonIds->count()) * 100, 2);

            return abs((float) $courseEnrollment->progress_percentage - $expected) < 0.01;
        });
    }

    private function courseCertificateIsValid(?User $student, ?Course $course, ?CourseCertificate $certificate, DemoCertificatePdfService $pdfs): bool
    {
        if (! $student || ! $course || ! $certificate) {
            return false;
        }

        $courseEnrollment = UserCourse::where('user_id', $student->id)->where('course_id', $course->id)->first();

        return $certificate->status === 'completed'
            && filled($certificate->verification_token)
            && $pdfs->isReadablePdf($certificate->file_path)
            && $courseEnrollment?->status === 'completed'
            && (float) $courseEnrollment->final_exam_score >= 60;
    }

    private function diplomaCertificateIsValid(?DiplomaCertificate $certificate, DemoCertificatePdfService $pdfs): bool
    {
        return (bool) ($certificate
            && $certificate->status === 'completed'
            && filled($certificate->verification_token)
            && $pdfs->isReadablePdf($certificate->file_path));
    }

    private function verificationPathsServePdf(?CourseCertificate $courseCertificate, ?DiplomaCertificate $diplomaCertificate): bool
    {
        if (! $courseCertificate?->verification_token || ! $diplomaCertificate?->verification_token) {
            return false;
        }

        try {
            $course = Http::timeout(5)->get(url('/api/course-certificate/verify/'.$courseCertificate->verification_token));
            $diploma = Http::timeout(5)->get(url('/api/diploma-certificate/verify/'.$diplomaCertificate->verification_token));

            return $this->isPdfResponse($course->status(), $course->header('Content-Type'), $course->body())
                && $this->isPdfResponse($diploma->status(), $diploma->header('Content-Type'), $diploma->body());
        } catch (\Throwable) {
            return false;
        }
    }

    private function isPdfResponse(int $status, ?string $contentType, string $body): bool
    {
        return $status === 200
            && str_contains((string) $contentType, 'application/pdf')
            && str_starts_with($body, '%PDF-')
            && strlen($body) > 256;
    }

    private function finalExamIsAvailable(?Course $course): bool
    {
        $quiz = $course?->finalExam()->with('questions')->first();

        return (bool) ($quiz && $quiz->questions->isNotEmpty() && $quiz->questions->every(function ($question): bool {
            $answers = is_array($question->correct_answer)
                ? $question->correct_answer
                : json_decode((string) $question->correct_answer, true);

            $hasCorrectAnswer = is_array($answers)
                ? $answers !== []
                : $answers !== null && $answers !== '';

            return is_array($question->options) && count($question->options) >= 2 && $hasCorrectAnswer;
        }));
    }

    private function hasNoPublicDemoDuplicates(): bool
    {
        return CategoryOfCourse::where('description', 'like', '%'.self::MARKER.'%')
            ->where('is_published', true)
            ->withCount('courses')
            ->get()
            ->groupBy('name')
            ->every(fn ($diplomas) => $diplomas->count() === 1 && $diplomas->first()->courses_count > 0);
    }

    private function authenticatedGet(?User $user, string $path): bool
    {
        if (! $user) {
            return false;
        }

        Sanctum::actingAs($user, ['*']);

        try {
            $response = app(Kernel::class)->handle(Request::create($path, 'GET', [], [], [], ['HTTP_ACCEPT' => 'application/json']));

            return $response->getStatusCode() === 200;
        } catch (\Throwable) {
            return false;
        } finally {
            Auth::guard('sanctum')->forgetUser();
            Auth::shouldUse('web');
        }
    }

    private function mutationIsBlocked(): bool
    {
        $response = app(EnsureDemoIsReadOnly::class)->handle(
            Request::create('/api/categories/1/enroll', 'POST'),
            fn () => response()->json(['unexpected' => true])
        );

        return $response->getStatusCode() === 403;
    }
}

<?php

namespace App\Services;

use App\Models\CategoryOfCourse;
use App\Models\Course;
use App\Models\UserCategoryEnrollment;
use App\Models\UserCourse;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;

class BeneficiaryReportService
{
    public function __construct(private DiplomaCompletionService $diplomaCompletion)
    {
    }

    /**
     * Build an administrative, historical report. The optional period is a
     * registration cohort period: completions are measured for that cohort.
     */
    public function report(array $filters): array
    {
        $diplomaEnrollments = $this->applyPeriod(
            UserCategoryEnrollment::query()->with('user:id,role'),
            $filters
        )
            ->whereHas('user', fn (Builder $query) => $this->excludeAdministrators($query))
            ->get();

        $courseEnrollments = $this->applyPeriod(
            UserCourse::query()->with('user:id,role'),
            $filters
        )
            ->whereHas('user', fn (Builder $query) => $this->excludeAdministrators($query))
            ->get();

        $diplomaCompletion = $this->diplomaCompletion->forEnrollments($diplomaEnrollments);
        $diplomaEnrollmentsByCategory = $diplomaEnrollments->groupBy('category_id');
        $courseEnrollmentsByCourse = $courseEnrollments->groupBy('course_id');

        $beneficiaryIds = $diplomaEnrollments->pluck('user_id')
            ->merge($courseEnrollments->pluck('user_id'))
            ->unique()
            ->values();
        $diplomaBeneficiaryIds = $diplomaEnrollments->pluck('user_id')->unique();
        $courseBeneficiaryIds = $courseEnrollments->pluck('user_id')->unique();
        $completedCourseIds = $courseEnrollments->where('status', 'completed')->pluck('user_id')->unique();
        $completedDiplomaIds = $diplomaEnrollments
            ->filter(fn (UserCategoryEnrollment $enrollment) => (bool) ($diplomaCompletion->get($enrollment->id)['completed'] ?? false))
            ->pluck('user_id')
            ->unique();

        $diplomas = CategoryOfCourse::query()->orderBy('name')->get(['id', 'name']);
        $courses = Course::withoutGlobalScope('published')
            ->with('category:id,name')
            ->orderBy('title')
            ->get(['id', 'title', 'category_id']);

        return [
            'generated_at' => now()->toIso8601String(),
            'filters' => [
                'from' => $filters['from'] ?? null,
                'to' => $filters['to'] ?? null,
                'period_definition' => 'فترة التسجيل؛ تُقاس الإكمالات لجميع المستفيدين المسجلين خلال الفترة المختارة.',
            ],
            'summary' => [
                'total_beneficiaries' => $beneficiaryIds->count(),
                'diploma_beneficiaries' => $diplomaBeneficiaryIds->count(),
                'course_beneficiaries' => $courseBeneficiaryIds->count(),
                'completed_any_course' => $completedCourseIds->count(),
                'completed_any_diploma' => $completedDiplomaIds->count(),
                'completed_any_learning_path' => $completedCourseIds->merge($completedDiplomaIds)->unique()->count(),
            ],
            'diplomas' => $diplomas->map(function (CategoryOfCourse $diploma) use ($diplomaEnrollmentsByCategory, $diplomaCompletion) {
                $enrollments = $diplomaEnrollmentsByCategory->get($diploma->id, collect());
                $enrolled = $enrollments->pluck('user_id')->unique()->count();
                $completed = $enrollments
                    ->filter(fn (UserCategoryEnrollment $enrollment) => (bool) ($diplomaCompletion->get($enrollment->id)['completed'] ?? false))
                    ->pluck('user_id')
                    ->unique()
                    ->count();

                return [
                    'diploma_id' => $diploma->id,
                    'diploma_name' => $diploma->name,
                    'beneficiaries_count' => $enrolled,
                    'completed_count' => $completed,
                    'completion_rate' => $enrolled > 0 ? round(($completed / $enrolled) * 100, 2) : 0,
                ];
            })->values()->all(),
            'courses' => $courses->map(function (Course $course) use ($courseEnrollmentsByCourse) {
                $enrollments = $courseEnrollmentsByCourse->get($course->id, collect());
                $enrolled = $enrollments->pluck('user_id')->unique()->count();
                $completed = $enrollments->where('status', 'completed')->pluck('user_id')->unique()->count();

                return [
                    'course_id' => $course->id,
                    'course_name' => $course->title,
                    'diploma_name' => $course->category?->name,
                    'beneficiaries_count' => $enrolled,
                    'completed_count' => $completed,
                    'completion_rate' => $enrolled > 0 ? round(($completed / $enrolled) * 100, 2) : 0,
                ];
            })->values()->all(),
        ];
    }

    private function applyPeriod(Builder $query, array $filters): Builder
    {
        return $query
            ->when($filters['from'] ?? null, fn (Builder $q, string $from) => $q->where('created_at', '>=', Carbon::parse($from)->startOfDay()))
            ->when($filters['to'] ?? null, fn (Builder $q, string $to) => $q->where('created_at', '<=', Carbon::parse($to)->endOfDay()));
    }

    private function excludeAdministrators(Builder $query): Builder
    {
        return $query->where(function (Builder $roleQuery) {
            $roleQuery->whereNull('role')->orWhere('role', '!=', 'admin');
        });
    }
}

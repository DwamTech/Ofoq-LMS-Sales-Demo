<?php

namespace App\Services;

use App\Models\Course;
use App\Models\UserCategoryEnrollment;
use App\Models\UserCourse;
use Illuminate\Support\Collection;

/**
 * Resolves diploma completion from the underlying learning records.
 *
 * Enrollment status remains an access/payment status (active, pending_payment, ...).
 * It is intentionally not used as the academic completion source of truth.
 */
class DiplomaCompletionService
{
    /**
     * @param Collection<int, UserCategoryEnrollment> $enrollments
     * @return Collection<int, array{progress_percentage: float, completed: bool, completed_at: mixed, completed_courses: int, total_required_courses: int}>
     */
    public function forEnrollments(Collection $enrollments): Collection
    {
        if ($enrollments->isEmpty()) {
            return collect();
        }

        $categoryIds = $enrollments->pluck('category_id')->filter()->unique()->values();
        $userIds = $enrollments->pluck('user_id')->filter()->unique()->values();

        $coursesByCategory = Course::withoutGlobalScope('published')
            ->whereIn('category_id', $categoryIds)
            ->with(['finalExam.questions:id,quiz_id'])
            ->get()
            ->groupBy('category_id');

        $courseIds = $coursesByCategory->flatten(1)->pluck('id')->values();
        $userCourses = UserCourse::query()
            ->whereIn('user_id', $userIds)
            ->whereIn('course_id', $courseIds)
            ->get()
            ->keyBy(fn (UserCourse $enrollment) => $enrollment->user_id . ':' . $enrollment->course_id);

        return $enrollments->mapWithKeys(function (UserCategoryEnrollment $enrollment) use ($coursesByCategory, $userCourses) {
            $requiredCourses = ($coursesByCategory->get($enrollment->category_id) ?? collect())
                ->filter(fn (Course $course) => !$course->finalExam || $course->finalExam->questions->isNotEmpty())
                ->values();

            $completedCourses = $requiredCourses->filter(function (Course $course) use ($enrollment, $userCourses) {
                /** @var UserCourse|null $courseEnrollment */
                $courseEnrollment = $userCourses->get($enrollment->user_id . ':' . $course->id);
                if (!$courseEnrollment || $courseEnrollment->status !== 'completed') {
                    return false;
                }

                return !$course->finalExam || (float) $courseEnrollment->final_exam_score >= 60;
            })->values();

            $totalRequired = $requiredCourses->count();
            $completedCount = $completedCourses->count();
            $progress = $totalRequired > 0 ? round(($completedCount / $totalRequired) * 100, 2) : 0.0;
            $completed = $totalRequired > 0 && $completedCount === $totalRequired;

            $completedAt = $completed
                ? $completedCourses
                    ->map(fn (Course $course) => $userCourses->get($enrollment->user_id . ':' . $course->id)?->completed_at)
                    ->filter()
                    ->max()
                : null;

            return [(int) $enrollment->id => [
                'progress_percentage' => $progress,
                'completed' => $completed,
                'completed_at' => $completedAt,
                'completed_courses' => $completedCount,
                'total_required_courses' => $totalRequired,
            ]];
        });
    }
}

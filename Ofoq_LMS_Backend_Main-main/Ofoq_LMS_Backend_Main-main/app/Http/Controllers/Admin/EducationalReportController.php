<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CategoryOfCourse;
use App\Models\Course;
use App\Models\Lesson;
use App\Models\User;
use App\Services\BeneficiaryReportService;
use App\Services\BeneficiaryReportPdfService;
use App\Services\EducationalReportService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class EducationalReportController extends Controller
{
    public function __construct(
        private EducationalReportService $reports,
        private BeneficiaryReportService $beneficiaryReports,
        private BeneficiaryReportPdfService $beneficiaryReportPdf,
    )
    {
    }

    public function overview(Request $request)
    {
        $filters = $this->validatedFilters($request);

        return response()->json([
            'success' => true,
            'data' => $this->reports->overview($filters),
        ]);
    }

    public function student(Request $request, User $student)
    {
        $filters = $this->validatedFilters($request);

        return response()->json([
            'success' => true,
            'data' => $this->reports->studentReport($student, $filters),
        ]);
    }

    public function lesson(Request $request, Lesson $lesson)
    {
        $filters = $this->validatedFilters($request);

        return response()->json([
            'success' => true,
            'data' => $this->reports->lessonReport($lesson, $filters),
        ]);
    }

    public function course(Request $request, Course $course)
    {
        $filters = $this->validatedFilters($request);

        return response()->json([
            'success' => true,
            'data' => $this->reports->courseReport($course, $filters),
        ]);
    }

    public function diploma(Request $request, CategoryOfCourse $category)
    {
        $filters = $this->validatedFilters($request);

        return response()->json([
            'success' => true,
            'data' => $this->reports->diplomaReport($category, $filters),
        ]);
    }

    public function beneficiaries(Request $request)
    {
        $filters = $request->validate([
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date', 'after_or_equal:from'],
        ]);

        return response()->json([
            'success' => true,
            'data' => $this->beneficiaryReports->report($filters),
        ]);
    }

    public function beneficiariesPdf(Request $request)
    {
        $filters = $request->validate([
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date', 'after_or_equal:from'],
        ]);

        $path = $this->beneficiaryReportPdf->generate($this->beneficiaryReports->report($filters));
        $filename = 'beneficiaries-report-' . now()->format('Y-m-d') . '.pdf';

        return response()->download($path, $filename, [
            'Content-Type' => 'application/pdf',
        ])->deleteFileAfterSend(true);
    }

    private function validatedFilters(Request $request): array
    {
        return $request->validate([
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date', 'after_or_equal:from'],
            'category_id' => ['nullable', 'integer', 'exists:category_of_course,id'],
            'diploma_id' => ['nullable', 'integer', 'exists:category_of_course,id'],
            'course_id' => ['nullable', 'integer', 'exists:courses,id'],
            'status' => ['nullable', 'string', Rule::in(['active', 'pending', 'in_progress', 'completed', 'not_started', 'failed'])],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
            'students_page' => ['nullable', 'integer', 'min:1'],
            'lessons_page' => ['nullable', 'integer', 'min:1'],
            'courses_page' => ['nullable', 'integer', 'min:1'],
            'limit' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);
    }
}

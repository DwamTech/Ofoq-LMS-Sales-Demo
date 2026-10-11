<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\ExamQuestionResource;
use App\Models\Certificate;
use App\Models\Course;
use App\Models\CourseCertificate;
use App\Models\DiplomaCertificate;
use App\Models\User;
use App\Models\UserCourse;
use App\Models\UserQuizAttempt;
use App\Services\EducationalReportService;
use App\Support\DemoPersonas;
use Illuminate\Http\Request;

/** Read-only administrative projections, never issuance, scoring or synchronization. */
class ShowcaseReadController extends Controller
{
    private function authorizeAdmin(Request $request): void
    {
        abort_unless($request->user()?->role === 'admin' && $request->user()->hasRole('admin'), 403);
    }

    public function students(Request $request)
    {
        $this->authorizeAdmin($request);
        $filters = $request->validate(['search' => 'nullable|string|max:100', 'showcase' => 'nullable|boolean', 'page' => 'nullable|integer|min:1', 'per_page' => 'nullable|integer|min:1|max:50']);
        $students = User::where('role', 'student')
            ->when($filters['showcase'] ?? false, fn ($query) => $query->where('email', DemoPersonas::ACCOUNTS['student']))
            ->when($filters['search'] ?? null, fn ($query, $search) => $query->where('name', 'like', '%'.$search.'%'))
            ->withCount(['enrollments', 'categoryEnrollments'])
            ->orderBy('id')->paginate($filters['per_page'] ?? 20, ['id', 'name']);

        return response()->json(['data' => $students->map(fn ($user) => [
            'id' => $user->id, 'name' => $user->name,
            'courses_count' => $user->enrollments_count, 'diplomas_count' => $user->category_enrollments_count,
        ]), 'pagination' => ['current_page' => $students->currentPage(), 'last_page' => $students->lastPage(), 'total' => $students->total()]], 200, ['Cache-Control' => 'no-store, private']);
    }

    public function student(Request $request, User $student, EducationalReportService $reports)
    {
        $this->authorizeAdmin($request);
        abort_unless($student->role === 'student', 404);
        $data = $reports->studentReport($student, ['per_page' => 100]);
        // Public showcase projection deliberately omits contact/birth/financial fields.
        $data['student'] = ['id' => $student->id, 'name' => $student->name];
        unset($data['estimated_bunny_cost']);
        $courses = Course::withoutGlobalScope('published')->whereIn('id', collect($data['courses'])->pluck('course_id'))->with('finalExam')->get()->keyBy('id');
        $quizIds = $courses->pluck('finalExam.id')->filter();
        $attempts = UserQuizAttempt::where('user_id', $student->id)->whereIn('quiz_id', $quizIds)->orderByDesc('id')->get()->groupBy('quiz_id');
        $enrollments = UserCourse::where('user_id', $student->id)->whereIn('course_id', $courses->keys())->get()->keyBy('course_id');
        $data['courses'] = collect($data['courses'])->map(function ($row) use ($courses, $attempts, $enrollments) {
            $course = $courses->get($row['course_id']);
            $attempt = $attempts->get($course?->finalExam?->id)?->first();
            $row['has_final_exam'] = (bool) $course?->finalExam;
            $row['exam_status'] = $attempt?->status ?? 'not_started';
            $row['exam_score'] = $attempt?->score;
            $enrollment = $enrollments->get($row['course_id']);
            // Match DiplomaCompletionService's persisted academic rule. A later
            // attempt is displayed separately and cannot rewrite a prior achievement.
            $row['academic_completed'] = $enrollment?->status === 'completed'
                && (! $course?->finalExam || ($enrollment->final_exam_score !== null && (float) $enrollment->final_exam_score >= 60));

            return $row;
        })->values();
        $courseCertificates = CourseCertificate::where('user_id', $student->id)->with('course:id,title')->get()->map(fn ($certificate) => [
            'id' => $certificate->id, 'source' => 'course', 'program' => $certificate->course?->title,
            'status' => $certificate->status, 'serial_number' => $certificate->serial_number,
            'record_created_at' => $certificate->created_at, 'issued_at' => null,
        ]);
        $diplomaCertificates = DiplomaCertificate::where('user_id', $student->id)->with('diploma:id,name')->get()->map(fn ($certificate) => [
            'id' => $certificate->id, 'source' => 'diploma', 'program' => $certificate->diploma?->name,
            'status' => $certificate->status, 'serial_number' => $certificate->serial_number,
            'record_created_at' => $certificate->created_at, 'issued_at' => $certificate->issued_at,
        ]);
        $legacy = Certificate::where('user_id', $student->id)->with('course:id,title')->get()->map(fn ($certificate) => [
            'id' => $certificate->id, 'source' => 'legacy-course', 'program' => $certificate->course?->title,
            'status' => $certificate->issued_at ? 'issued' : 'pending', 'serial_number' => $certificate->serial_number,
            'record_created_at' => $certificate->created_at, 'issued_at' => $certificate->issued_at,
        ]);
        $data['certificates'] = $courseCertificates->concat($diplomaCertificates)->concat($legacy)->values();

        return response()->json(['data' => $data], 200, ['Cache-Control' => 'no-store, private']);
    }

    public function exam(Request $request, string $course)
    {
        $this->authorizeAdmin($request);
        $model = Course::withoutGlobalScope('published')->with('finalExam.questions')->findOrFail($course);
        $exam = $model->finalExam;
        abort_unless($exam, 404);

        return response()->json(['data' => [
            'course' => ['id' => $model->id, 'title' => $model->title],
            'exam' => ['id' => $exam->id, 'title' => $exam->title, 'question_count' => $exam->questions->count()],
            // The display does not need answer keys, even for administrators.
            'questions' => ExamQuestionResource::collection($exam->questions),
            'attempts_by_status' => UserQuizAttempt::where('quiz_id', $exam->id)->selectRaw('status, COUNT(*) AS count')->groupBy('status')->pluck('count', 'status'),
        ]], 200, ['Cache-Control' => 'no-store, private']);
    }
}

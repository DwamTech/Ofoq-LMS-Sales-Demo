<?php

namespace App\Http\Resources;

use App\Models\UserCourse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class CourseResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray($request)
    {
        $isAdmin = Auth::user()?->role === 'admin';
        $stats = $this->buildStats();

        // Helper صغير يضمن URL مطلق للصور سواء كانت مخزنة كمسار نسبي (inst/...) أو كرابط كامل
        $mediaUrl = function (?string $path): ?string {
            if (!$path) return null;
            return Str::startsWith($path, ['http://', 'https://'])
                ? $path
                : asset('storage/' . ltrim($path, '/'));
        };

        return [
            'id'               => $this->id,
            'title'            => $this->title,
            'description'      => $this->description,
            'rank'             => $this->rank,
            'duration'         => $this->duration,
            'instructor_id'    => $this->instructor_id,
            'category_id'      => $this->category_id,
            'section_id'       => $this->section_id,
            'price'            => $this->price,
            'discount_price'   => $this->discount_price,
            'discount_ends_at' => $this->discount_ends_at,
            'is_free'          => (bool) $this->is_free,
            'rating'           => $this->rating,
            'average_rating'   => $this->when(isset($this->reviews_avg_rating), round($this->reviews_avg_rating, 1)),

            // صور الكورس
            // Ensure we don't return false/0 values which cause broken URLs like /storage/0
            'cover_image'      => $this->cover_image && $this->cover_image !== '0' ? $this->cover_image : null,
            'cover_image_url'  => ($this->cover_image && $this->cover_image !== '0') 
                ? ($this->cover_image_url ?? $mediaUrl($this->cover_image)) 
                : null,

            // حالة النشر (للأدمن فقط)
            'is_published'     => $isAdmin ? (bool) $this->is_published : null,
            'status'           => $isAdmin ? ($this->is_published ? 'published' : 'draft') : null,

            // بيانات المحاضر:
            // - لو علاقة instructor محمّلة: نرجّعها كاملة
            // - لو مش محمّلة: نعمل fallback من الأعمدة المنزوعة التطبيع داخل جدول courses
            'instructor' => $this->whenLoaded('instructor', function () use ($mediaUrl) {
                return [
                    'id'     => $this->instructor->id,
                    'name'   => $this->instructor->name,
                    'title'  => $this->instructor->title,
                    'bio'    => $this->instructor->bio,
                    'image'  => $this->instructor->image ? $mediaUrl($this->instructor->image) : null,
                    'rating' => $this->instructor->avg_rate,
                ];
            }, function () use ($mediaUrl) {
                return [
                    'id'     => $this->instructor_id,
                    'name'   => $this->name_instructor,
                    'title'  => $this->title_instructor,
                    'bio'    => $this->bio_instructor,
                    'image'  => $this->image_instructor_url ?? $mediaUrl($this->image_instructor),
                    'rating' => null,
                ];
            }),

            // التصنيف:
            // - لو علاقة category محمّلة: نرجّع كائن {id, name}
            // - وإلا fallback على الأعمدة النصّية/المعرف داخل الكورس
            'category' => $this->whenLoaded('category', function () {
                return [
                    'id'   => $this->category->id,
                    'name' => $this->category->name,
                ];
            }, function () {
                return $this->category || $this->category_id
                    ? ['id' => $this->category_id, 'name' => $this->category]
                    : null;
            }),

            'section' => $this->whenLoaded('section', function () {
                if (! $this->section) {
                    return null;
                }

                return [
                    'id'   => $this->section->id,
                    'name' => $this->section->name,
                    'slug' => $this->section->slug,
                    'icon' => $this->section->icon,
                ];
            }),
            'sections' => $this->whenLoaded('sections', function () {
                return $this->sections->map(fn ($section) => [
                    'id'   => $section->id,
                    'name' => $section->name,
                    'slug' => $section->slug,
                    'icon' => $section->icon,
                ])->values();
            }, function () {
                if (! $this->relationLoaded('section') || ! $this->section) {
                    return [];
                }

                return [[
                    'id'   => $this->section->id,
                    'name' => $this->section->name,
                    'slug' => $this->section->slug,
                    'icon' => $this->section->icon,
                ]];
            }),

            // Counts
            'chapters_count' => $this->chapters_count ?? $this->whenLoaded('chapters', $this->chapters->count()),
            'lessons_count'  => $this->lessons_count ?? null,
            'reviews_count'  => $this->reviews_count ?? null,
            'students_count' => $stats['students_count'],
            'total_views' => $stats['views_count'],
            'stats' => $stats,

            // مؤشر وجود اختبار نهائي
            'has_final_exam' => $this->whenLoaded('finalExam', function () {
                // التحقق من وجود الاختبار النهائي ومن وجود أسئلة فيه
                if ($this->finalExam === null) {
                    return false;
                }
                // التحقق من عدد الأسئلة
                $questionsCount = $this->finalExam->questions()->count();
                return $questionsCount > 0;
            }, function () {
                // fallback: if finalExam not loaded, return null instead of checking
                return null;
            }),

            // علاقات (تُحمّل عند الحاجة)
            'chapters' => ChapterResource::collection($this->whenLoaded('chapters')),
            'reviews'  => ReviewResource::collection($this->whenLoaded('reviews')),
        ];
    }

    private function buildStats(): array
    {
        $hasDetailedContent = $this->relationLoaded('chapters');
        $lessons = collect();

        if ($hasDetailedContent) {
            $lessons = $this->chapters
                ->flatMap(fn ($chapter) => $chapter->relationLoaded('lessons') ? $chapter->lessons : collect())
                ->values();
        }

        $chaptersCount = (int) ($this->chapters_count ?? ($hasDetailedContent ? $this->chapters->count() : 0));
        $lessonsCount = (int) ($this->lessons_count ?? ($hasDetailedContent ? $lessons->count() : 0));
        $reviewsCount = (int) ($this->reviews_count ?? ($this->relationLoaded('reviews') ? $this->reviews->count() : 0));
        $studentsCount = $hasDetailedContent
            ? UserCourse::where('course_id', $this->id)->count()
            : (int) ($this->students_count ?? 0);

        $viewsCount = (int) ($this->total_views ?? 0);
        if ($viewsCount === 0 && $hasDetailedContent) {
            $viewsCount = (int) $lessons->sum(fn ($lesson) => (int) ($lesson->views ?? 0));
        }

        $durationSeconds = $hasDetailedContent
            ? (int) $lessons->sum(function ($lesson) {
                $lessonDuration = (int) ($lesson->duration_seconds ?? 0);
                if ($lessonDuration > 0) {
                    return $lessonDuration;
                }

                return (int) ($lesson->relationLoaded('bunnyVideoStat')
                    ? ($lesson->bunnyVideoStat?->duration_seconds ?? 0)
                    : 0);
            })
            : 0;

        if ($durationSeconds === 0 && is_numeric($this->duration)) {
            $durationSeconds = (int) round(((float) $this->duration) * 3600);
        }

        $attachmentsCount = $hasDetailedContent
            ? (int) $lessons->sum(fn ($lesson) => $this->countListItems($lesson->attachments ?? null))
            : 0;
        $resourcesCount = $hasDetailedContent
            ? (int) $lessons->sum(fn ($lesson) => $this->countListItems($lesson->resources ?? null))
            : 0;

        $lessonQuizzes = $hasDetailedContent
            ? $lessons->map(fn ($lesson) => $lesson->relationLoaded('quiz') ? $lesson->quiz : null)->filter()
            : collect();
        $finalExam = $this->relationLoaded('finalExam') ? $this->finalExam : null;
        $quizzesCount = $lessonQuizzes->count() + ($finalExam ? 1 : 0);
        $questionsCount = (int) $lessonQuizzes->sum(fn ($quiz) => $quiz->relationLoaded('questions') ? $quiz->questions->count() : 0);

        if ($finalExam && $finalExam->relationLoaded('questions')) {
            $questionsCount += $finalExam->questions->count();
        }

        [$levelKey, $levelLabel] = $this->resolveLevel($durationSeconds, $lessonsCount, $questionsCount);
        $averageRating = $this->reviews_avg_rating ?? $this->average_rating ?? $this->rating ?? 0;

        return [
            'chapters_count' => $chaptersCount,
            'lessons_count' => $lessonsCount,
            'students_count' => (int) $studentsCount,
            'duration_seconds' => $durationSeconds,
            'duration_hours' => round($durationSeconds / 3600, 1),
            'views_count' => $viewsCount,
            'reviews_count' => $reviewsCount,
            'average_rating' => round((float) $averageRating, 1),
            'attachments_count' => $attachmentsCount,
            'resources_count' => $resourcesCount,
            'quizzes_count' => $quizzesCount,
            'questions_count' => $questionsCount,
            'level_key' => $levelKey,
            'level_label' => $levelLabel,
            'language' => 'ar',
            'language_label' => 'العربية',
            'source' => $hasDetailedContent ? 'calculated' : 'summary',
        ];
    }

    private function countListItems(mixed $value): int
    {
        if (is_array($value)) {
            return count($value);
        }

        if (is_string($value) && trim($value) !== '') {
            $decoded = json_decode($value, true);
            return is_array($decoded) ? count($decoded) : 1;
        }

        return 0;
    }

    private function resolveLevel(int $durationSeconds, int $lessonsCount, int $questionsCount): array
    {
        if ($durationSeconds >= 36000 || $lessonsCount >= 40 || $questionsCount >= 80) {
            return ['advanced', 'متقدم'];
        }

        if ($durationSeconds >= 10800 || $lessonsCount >= 10 || $questionsCount >= 25) {
            return ['intermediate', 'متوسط'];
        }

        return ['beginner', 'مبتدئ'];
    }
}

<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CategoryOfCourse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class CategoryController extends Controller
{
    /**
     * List all categories (diplomas) with course counts.
     */
    public function index()
    {
        $categories = CategoryOfCourse::query()
            ->with('section')
            ->withCount('courses')
            // Order by display_order ascending, NULLs last, then by id
            ->orderByRaw('`display_order` IS NULL')
            ->orderBy('display_order')
            ->orderBy('id')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $categories,
            'meta' => [
                'total' => $categories->count(),
            ],
        ]);
    }

    /**
     * Create a new category (diploma) including optional cover image.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:category_of_course,name',
            'description' => 'nullable|string',
            'slug' => 'nullable|string|unique:category_of_course,slug',
            'is_published' => 'sometimes|boolean',
            'is_free' => 'sometimes|boolean',
            'price' => 'nullable|numeric|min:0',
            'cover_image' => 'nullable|image|max:20480', // up to ~20MB
            'display_order' => 'nullable|integer|min:0',
            'section_id' => 'nullable|exists:sections,id',
        ], [
            'name.unique' => 'عفواً، هذا الاسم مستخدم بالفعل، يرجى اختيار اسم آخر للدبلومة.',
            'slug.unique' => 'عفواً، هذا الرابط (slug) مستخدم بالفعل، يرجى اختيار رابط آخر.',
        ]);

        if (!empty($validated['is_free'])) {
            $validated['price'] = 0;
        }

        if ($request->hasFile('cover_image')) {
            $path = $request->file('cover_image')->store('categories/cover_images', 'public');
            $validated['cover_image'] = $path;
        }

        $category = CategoryOfCourse::create($validated)->load('section');

        return response()->json([
            'success' => true,
            'message' => 'Category created successfully',
            'data' => $category,
        ], 201);
    }

    /**
     * Update an existing category (diploma) including optional cover image replacement.
     */
    public function update(Request $request, $id)
    {
        $category = CategoryOfCourse::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:category_of_course,name,' . $category->id,
            'description' => 'nullable|string',
            'slug' => 'nullable|string|unique:category_of_course,slug,' . $category->id,
            'is_published' => 'sometimes|boolean',
            'is_free' => 'sometimes|boolean',
            'price' => 'nullable|numeric|min:0',
            'cover_image' => 'nullable|image|max:20480',
            'display_order' => 'nullable|integer|min:0',
            'section_id' => 'nullable|exists:sections,id',
        ], [
            'name.unique' => 'عفواً، هذا الاسم مستخدم بالفعل، يرجى اختيار اسم آخر للدبلومة.',
            'slug.unique' => 'عفواً، هذا الرابط (slug) مستخدم بالفعل، يرجى اختيار رابط آخر.',
        ]);

        if (!empty($validated['is_free'])) {
            $validated['price'] = 0;
        }

        if ($request->hasFile('cover_image')) {
            if ($category->cover_image && Storage::disk('public')->exists($category->cover_image)) {
                Storage::disk('public')->delete($category->cover_image);
            }
            $path = $request->file('cover_image')->store('categories/cover_images', 'public');
            $validated['cover_image'] = $path;
        }

        $category->update($validated);
        $category->load('section');

        return response()->json([
            'success' => true,
            'message' => 'Category updated successfully',
            'data' => $category,
        ]);
    }

    /**
     * Show a single category (diploma).
     */
    public function show($id)
    {
        $category = CategoryOfCourse::query()
            ->with('section')
            ->withCount('courses')
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $category,
        ]);
    }

    /**
     * Delete a category (diploma) and its cover image; courses will be detached via FK onDelete(set null).
     */
    public function destroy($id)
    {
        $category = CategoryOfCourse::findOrFail($id);

        if ($category->cover_image && Storage::disk('public')->exists($category->cover_image)) {
            Storage::disk('public')->delete($category->cover_image);
        }

        $category->delete();

        return response()->json([
            'success' => true,
            'message' => 'Category deleted successfully',
        ]);
    }

    /**
     * Get all subscribers (students) enrolled in a diploma with their full info,
     * all courses in the diploma, and progress percentage for each course.
     */
    public function getSubscribers($id)
    {
        $diploma = CategoryOfCourse::with(['courses' => function ($query) {
            $query->withCount('lessons');
        }])->findOrFail($id);

        // Get all enrollments for this diploma
        $enrollments = \App\Models\UserCategoryEnrollment::where('category_id', $id)
            ->with('user')
            ->get();

        $subscribers = $enrollments->map(function ($enrollment) use ($diploma) {
            $user = $enrollment->user;

            if (!$user) {
                return null;
            }

            // Calculate progress for each course
            $coursesProgress = $diploma->courses->map(function ($course) use ($user) {
                $totalLessons = $course->lessons_count;
                
                if ($totalLessons === 0) {
                    return [
                        'course_id' => $course->id,
                        'course_title' => $course->title,
                        'total_lessons' => 0,
                        'completed_lessons' => 0,
                        'progress_percentage' => 0,
                    ];
                }

                // Count completed lessons for this user in this course
                $completedLessons = \App\Models\UserLessonProgress::where('user_id', $user->id)
                    ->where('status', 'completed')
                    ->whereHas('lesson', function ($query) use ($course) {
                        $query->whereHas('chapter', function ($q) use ($course) {
                            $q->where('course_id', $course->id);
                        });
                    })
                    ->count();

                $progressPercentage = round(($completedLessons / $totalLessons) * 100, 2);

                return [
                    'course_id' => $course->id,
                    'course_title' => $course->title,
                    'total_lessons' => $totalLessons,
                    'completed_lessons' => $completedLessons,
                    'progress_percentage' => $progressPercentage,
                ];
            });

            // Calculate overall diploma progress
            $totalCourses = $diploma->courses->count();
            $overallProgress = $totalCourses > 0 
                ? round($coursesProgress->avg('progress_percentage'), 2) 
                : 0;

            return [
                'enrollment_id' => $enrollment->id,
                'enrollment_status' => $enrollment->status,
                'enrolled_at' => $enrollment->created_at,
                'completed_at' => $enrollment->completed_at,
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'phone' => $user->phone,
                    'nationality' => $user->nationality,
                    'qualification' => $user->qualification,
                    'media_work_sector' => $user->media_work_sector,
                    'date_of_birth' => $user->date_of_birth,
                    'previous_field' => $user->previous_field,
                    'profile_picture' => $user->profile_picture,
                    'created_at' => $user->created_at,
                ],
                'overall_progress' => $overallProgress,
                'courses' => $coursesProgress,
            ];
        })->filter()->values();

        return response()->json([
            'success' => true,
            'message' => 'تم جلب المشتركين بنجاح',
            'data' => [
                'diploma' => [
                    'id' => $diploma->id,
                    'name' => $diploma->name,
                    'slug' => $diploma->slug,
                    'description' => $diploma->description,
                    'total_courses' => $diploma->courses->count(),
                    'total_subscribers' => $subscribers->count(),
                ],
                'subscribers' => $subscribers,
            ],
        ]);
    }
}

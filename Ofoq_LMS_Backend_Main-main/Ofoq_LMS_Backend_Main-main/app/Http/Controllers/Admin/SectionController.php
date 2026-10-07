<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\SectionResource;
use App\Models\Section;
use Illuminate\Http\Request;

class SectionController extends Controller
{
    public function index()
    {
        $sections = Section::query()
            ->withCount(['diplomas', 'courses'])
            ->orderByRaw('`display_order` IS NULL')
            ->orderBy('display_order')
            ->orderBy('id')
            ->get();

        return SectionResource::collection($sections)
            ->additional(['success' => true]);
    }

    public function publicIndex()
    {
        $sections = Section::query()
            ->where('is_published', true)
            ->withCount(['diplomas' => function ($query) {
                $query->where('is_published', true);
            }])
            ->orderByRaw('`display_order` IS NULL')
            ->orderBy('display_order')
            ->orderBy('id')
            ->get();

        return SectionResource::collection($sections)
            ->additional(['success' => true]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'nullable|string|unique:sections,slug',
            'icon' => 'nullable|string',
            'is_published' => 'boolean',
            'display_order' => 'nullable|integer',
        ], [
            'slug.unique' => 'عفواً، هذا الرابط (slug) مستخدم بالفعل، يرجى اختيار رابط آخر.',
        ]);

        if (isset($validated['slug']) && empty($validated['slug'])) {
            unset($validated['slug']);
        }

        $section = Section::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Section created successfully.',
            'data' => new SectionResource($section->loadCount(['diplomas', 'courses']))
        ], 201);
    }

    public function show(Section $section)
    {
        return response()->json([
            'success' => true,
            'data' => new SectionResource($section)
        ]);
    }

    public function update(Request $request, Section $section)
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'slug' => 'nullable|string|unique:sections,slug,' . $section->id,
            'icon' => 'nullable|string',
            'is_published' => 'boolean',
            'display_order' => 'nullable|integer',
        ], [
            'slug.unique' => 'عفواً، هذا الرابط (slug) مستخدم بالفعل، يرجى اختيار رابط آخر.',
        ]);

        $section->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Section updated successfully.',
            'data' => new SectionResource($section)
        ]);
    }

    public function destroy(Section $section)
    {
        // Nullify section_id in related courses and categories is handled by onDelete('set null')
        $section->delete();

        return response()->json([
            'success' => true,
            'message' => 'Section deleted successfully.'
        ]);
    }
}

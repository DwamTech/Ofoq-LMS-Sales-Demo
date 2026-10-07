<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Course;
use App\Models\Chapter;
use App\Models\Lesson;
use App\Services\BunnyStreamService;

class BunnyController extends Controller
{
    protected $bunnyService;

    public function __construct(BunnyStreamService $bunnyService)
    {
        $this->bunnyService = $bunnyService;
    }

    public function initUpload(Request $request)
    {
        $request->validate([
            'course_id' => 'required|exists:courses,id',
            'video_title' => 'required|string|max:255'
        ]);

        try {
            $course = Course::findOrFail($request->course_id);
            $courseIdentifier = "Course_{$course->id}";

            // Get or create collection
            $collectionId = $this->bunnyService->getOrCreateCollection($courseIdentifier);

            // Create Video Object
            $videoData = $this->bunnyService->createVideo($request->video_title, $collectionId);

            $authData = $this->bunnyService->getTusAuthSignature($videoData['guid']);

            return response()->json([
                'success' => true,
                'data' => [
                    'videoGuid' => $videoData['guid'],
                    'collectionId' => $collectionId,
                    'libraryId' => $authData['libraryId'],
                    'authorizationSignature' => $authData['signature'],
                    'authorizationExpire' => $authData['expire'],
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to initialize Bunny upload',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}

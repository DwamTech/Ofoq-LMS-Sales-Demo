<?php

namespace App\Http\Controllers\Webhook;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Lesson;
use Illuminate\Support\Facades\Log;
use App\Services\BunnyStreamService;

class BunnyWebhookController extends Controller
{
    protected $bunnyService;

    public function __construct(BunnyStreamService $bunnyService)
    {
        $this->bunnyService = $bunnyService;
    }

    public function handle(Request $request)
    {
        try {
            // Bunny sends VideoGuid, Status, etc.
            $videoGuid = $request->input('VideoGuid');
            $status = $request->input('Status'); // 3 = Finished encoding, 4 = Failed, etc. based on Bunny Docs
            // Statuses: 0 = Queued, 1 = Processing, 2 = Encoding, 3 = Finished, 4 = Resolution finished, 5 = Failed, 6 = PresignedUploadStarted

            if (!$videoGuid) {
                return response()->json(['message' => 'Missing VideoGuid'], 400);
            }

            $lesson = Lesson::where('video_guid', $videoGuid)->first();

            if (!$lesson) {
                return response()->json(['message' => 'Lesson not found, but acknowledged'], 200);
            }

            if ($status == 3) {
                $lesson->video_status = 'ready';
                // Only now we can securely formulate the hls stream url
                $lesson->video_url = $this->bunnyService->getHLSUrl($videoGuid);
                $lesson->save();
            } elseif ($status == 4 || $status == 5) {
                $lesson->video_status = 'failed';
                $lesson->save();
            }

            return response()->json(['message' => 'Webhook received']);
        } catch (\Exception $e) {
            Log::error('Bunny Webhook Error: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to process webhook'], 500);
        }
    }
}

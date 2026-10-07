<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Lesson;
use App\Services\BunnyStreamService;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class BunnySyncStatus extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'bunny:sync-status';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Sync video statuses from Bunny CDN for stuck processing videos';

    /**
     * Execute the console command.
     */
    public function handle(BunnyStreamService $bunnyService)
    {
        $this->info("Starting Bunny CDN stuck videos sync job...");
        
        // Find all lessons that have been in 'processing' or 'uploading' for more than 1 hour
        $stuckLessons = Lesson::whereNotNull('video_guid')
            ->whereIn('video_status', ['processing', 'uploading', 'checking']) // Added other possible generic statuses
            ->where('updated_at', '<', Carbon::now()->subHour())
            ->get();

        if ($stuckLessons->isEmpty()) {
            $this->info("No stuck videos found.");
            return;
        }

        $this->info("Found " . $stuckLessons->count() . " lessons stuck in processing for over 1 hour.");

        foreach ($stuckLessons as $lesson) {
            $this->info("Checking Lesson ID: {$lesson->id} with Video GUID: {$lesson->video_guid}");
            try {
                $videoDetails = $bunnyService->getVideo($lesson->video_guid);
                
                if ($videoDetails) {
                    $status = $videoDetails['status'] ?? null;
                    if ($status === 4) { // 4 is Finished in Bunny CDN API
                        $lesson->update(['video_status' => 'ready']);
                        $this->info(" - Video is ready! Updated Lesson {$lesson->id}.");
                        Log::info("BunnySyncStatus: Lesson {$lesson->id} status updated to ready (fallback).");
                    } elseif ($status === 5) { // Failed
                        $lesson->update(['video_status' => 'failed']);
                        $this->info(" - Video processing failed on Bunny end.");
                    } else {
                        $this->info(" - Status on Bunny is still {$status}. Skipping.");
                    }
                } else {
                    $this->warn(" - Video not found on Bunny! Abandoned upload? Deleting GUID but keeping Lesson.");
                    // It means the video was never fully uploaded to Bunny or deleted from Bunny dashboard.
                    // We shouldn't delete the lesson, just clear the guid.
                    $lesson->update([
                        'video_guid' => null,
                        'video_status' => null
                    ]);
                }
            } catch (\Exception $e) {
                $this->error(" - Error checking video: " . $e->getMessage());
                Log::error("BunnySyncStatus Error checking video {$lesson->video_guid}: " . $e->getMessage());
            }
        }
        $this->info("Sync completed.");
    }
}

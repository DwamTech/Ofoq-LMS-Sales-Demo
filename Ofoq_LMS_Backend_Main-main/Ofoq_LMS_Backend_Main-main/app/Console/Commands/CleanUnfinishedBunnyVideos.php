<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class CleanUnfinishedBunnyVideos extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'bunny:cleanup';

    protected $description = 'Clean up unfinished video uploads from BunnyStream over 24 hours old';

    public function handle()
    {
        $lessons = \App\Models\Lesson::where('video_status', 'processing')
            ->where('updated_at', '<', now()->subHours(24))
            ->get();

        $bunnyService = app(\App\Services\BunnyStreamService::class);
        $count = 0;

        foreach ($lessons as $lesson) {
            // Delete from Bunny
            if ($lesson->video_guid) {
                $bunnyService->deleteVideo($lesson->video_guid);
            }

            // Update local lesson status to failed
            $lesson->video_status = 'failed';
            $lesson->video_guid = null;
            $lesson->save();

            $count++;
        }

        $this->info("Cleaned up {$count} unfinished Bunny videos.");
    }
}

<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Course;

class PublishAllCourses extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'courses:publish-all 
                            {--dry-run : Show what would be updated without making changes}
                            {--force : Force the operation without confirmation}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Publish all unpublished courses to fix 404 routing issues';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('🔍 Checking unpublished courses...');
        
        // Get unpublished courses (bypassing global scope)
        $unpublishedCourses = Course::withoutGlobalScopes()
            ->where(function ($query) {
                $query->where('is_published', false)
                      ->orWhereNull('is_published');
            })
            ->get();
        
        $count = $unpublishedCourses->count();
        
        if ($count === 0) {
            $this->info('✅ All courses are already published!');
            return 0;
        }
        
        $this->warn("Found {$count} unpublished course(s):");
        
        // Display courses in a table
        $this->table(
            ['ID', 'Title', 'Status', 'Created At'],
            $unpublishedCourses->map(function ($course) {
                return [
                    $course->id,
                    \Illuminate\Support\Str::limit($course->title, 50),
                    $course->is_published ? 'Published' : 'Unpublished',
                    $course->created_at->format('Y-m-d H:i:s'),
                ];
            })
        );
        
        // Dry run mode
        if ($this->option('dry-run')) {
            $this->info('🔍 Dry run mode - no changes made');
            $this->info("Would publish {$count} course(s)");
            return 0;
        }
        
        // Confirmation
        if (!$this->option('force')) {
            if (!$this->confirm("Do you want to publish these {$count} course(s)?")) {
                $this->info('Operation cancelled');
                return 0;
            }
        }
        
        // Update courses
        $this->info('📝 Publishing courses...');
        
        $progressBar = $this->output->createProgressBar($count);
        $progressBar->start();
        
        $updated = 0;
        foreach ($unpublishedCourses as $course) {
            $course->is_published = true;
            $course->save();
            $updated++;
            $progressBar->advance();
        }
        
        $progressBar->finish();
        $this->newLine(2);
        
        $this->info("✅ Successfully published {$updated} course(s)!");
        
        // Verify
        $remainingUnpublished = Course::withoutGlobalScopes()
            ->where(function ($query) {
                $query->where('is_published', false)
                      ->orWhereNull('is_published');
            })
            ->count();
        
        if ($remainingUnpublished === 0) {
            $this->info('✅ All courses are now published!');
        } else {
            $this->warn("⚠️  Warning: {$remainingUnpublished} course(s) still unpublished");
        }
        
        return 0;
    }
}

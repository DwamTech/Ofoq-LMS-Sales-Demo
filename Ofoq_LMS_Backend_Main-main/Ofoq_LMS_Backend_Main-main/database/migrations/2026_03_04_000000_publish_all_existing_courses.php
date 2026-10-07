<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * This migration fixes the 404 Not Found issue on /courses/{course} routes
     * by publishing all existing courses that were created before the is_published
     * column was added or were set to unpublished by default.
     */
    public function up(): void
    {
        // Check if courses table exists before updating
        if (!Schema::hasTable('courses')) {
            \Log::warning('Courses table does not exist yet, skipping publish_all_existing_courses migration');
            return;
        }
        
        // Update all courses to be published
        DB::table('courses')
            ->where(function ($query) {
                $query->where('is_published', false)
                      ->orWhereNull('is_published');
            })
            ->update(['is_published' => true]);
        
        // Log the number of courses updated
        $updatedCount = DB::table('courses')
            ->where('is_published', true)
            ->count();
        
        \Log::info("Published {$updatedCount} courses to fix 404 routing issue");
    }

    /**
     * Reverse the migrations.
     * 
     * Note: We don't unpublish courses on rollback as this would break
     * the application. If you need to unpublish specific courses,
     * do it manually through the admin panel.
     */
    public function down(): void
    {
        // Intentionally left empty - we don't want to unpublish courses
        // as this would cause the 404 issue to return
        \Log::warning('Rollback of publish_all_existing_courses migration was called but no action taken');
    }
};

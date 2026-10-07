<?php

/**
 * Quick Fix Script: Publish All Courses
 * 
 * This script updates all unpublished courses to fix the 404 routing issue.
 * Run this directly on the production server.
 * 
 * Usage:
 *   php publish_all_courses.php
 */

// Load Laravel bootstrap
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Course;
use Illuminate\Support\Facades\DB;

echo "=================================================\n";
echo "  Fix 404 Not Found Issue - Publish All Courses\n";
echo "=================================================\n\n";

try {
    // Check database connection
    echo "🔍 Checking database connection...\n";
    DB::connection()->getPdo();
    echo "✅ Database connected successfully!\n\n";
    
    // Get unpublished courses count (bypassing global scope)
    echo "🔍 Checking unpublished courses...\n";
    $unpublishedCount = Course::withoutGlobalScopes()
        ->where(function ($query) {
            $query->where('is_published', false)
                  ->orWhereNull('is_published');
        })
        ->count();
    
    if ($unpublishedCount === 0) {
        echo "✅ All courses are already published!\n";
        echo "No action needed.\n\n";
        exit(0);
    }
    
    echo "Found {$unpublishedCount} unpublished course(s)\n\n";
    
    // Show unpublished courses
    echo "📋 Unpublished Courses:\n";
    echo str_repeat("-", 80) . "\n";
    printf("%-5s | %-50s | %-10s\n", "ID", "Title", "Status");
    echo str_repeat("-", 80) . "\n";
    
    $unpublishedCourses = Course::withoutGlobalScopes()
        ->where(function ($query) {
            $query->where('is_published', false)
                  ->orWhereNull('is_published');
        })
        ->select('id', 'title', 'is_published')
        ->get();
    
    foreach ($unpublishedCourses as $course) {
        $status = $course->is_published ? 'Published' : 'Unpublished';
        $title = mb_substr($course->title, 0, 50);
        printf("%-5d | %-50s | %-10s\n", $course->id, $title, $status);
    }
    echo str_repeat("-", 80) . "\n\n";
    
    // Confirmation
    echo "⚠️  This will update {$unpublishedCount} course(s) to be published.\n";
    echo "Do you want to continue? (yes/no): ";
    
    $handle = fopen("php://stdin", "r");
    $line = trim(fgets($handle));
    fclose($handle);
    
    if (strtolower($line) !== 'yes' && strtolower($line) !== 'y') {
        echo "\n❌ Operation cancelled by user.\n\n";
        exit(0);
    }
    
    // Update courses
    echo "\n📝 Publishing courses...\n";
    
    DB::beginTransaction();
    
    try {
        $updated = DB::table('courses')
            ->where(function ($query) {
                $query->where('is_published', false)
                      ->orWhereNull('is_published');
            })
            ->update(['is_published' => true]);
        
        DB::commit();
        
        echo "✅ Successfully published {$updated} course(s)!\n\n";
        
        // Verify
        $remainingUnpublished = Course::withoutGlobalScopes()
            ->where(function ($query) {
                $query->where('is_published', false)
                      ->orWhereNull('is_published');
            })
            ->count();
        
        if ($remainingUnpublished === 0) {
            echo "✅ Verification: All courses are now published!\n";
        } else {
            echo "⚠️  Warning: {$remainingUnpublished} course(s) still unpublished\n";
        }
        
        // Show summary
        $totalCourses = Course::withoutGlobalScopes()->count();
        $publishedCourses = Course::withoutGlobalScopes()->where('is_published', true)->count();
        
        echo "\n📊 Summary:\n";
        echo "   Total Courses: {$totalCourses}\n";
        echo "   Published: {$publishedCourses}\n";
        echo "   Unpublished: {$remainingUnpublished}\n\n";
        
        echo "🎉 Done! The 404 routing issue should now be fixed.\n";
        echo "Test by accessing: /api/courses/{course_id}/final-exam/meta\n\n";
        
    } catch (\Exception $e) {
        DB::rollBack();
        throw $e;
    }
    
} catch (\Exception $e) {
    echo "\n❌ Error: " . $e->getMessage() . "\n";
    echo "File: " . $e->getFile() . "\n";
    echo "Line: " . $e->getLine() . "\n\n";
    exit(1);
}

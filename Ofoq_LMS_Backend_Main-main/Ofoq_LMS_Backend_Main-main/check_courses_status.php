<?php

/**
 * Check Courses Status Script
 * 
 * This script checks the current status of courses in the database
 * and helps diagnose the 404 routing issue.
 * 
 * Usage:
 *   php check_courses_status.php
 */

// Load Laravel bootstrap
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Course;
use Illuminate\Support\Facades\DB;

echo "=================================================\n";
echo "  Courses Status Check - Diagnostic Tool\n";
echo "=================================================\n\n";

try {
    // Check database connection
    echo "🔍 Checking database connection...\n";
    DB::connection()->getPdo();
    echo "✅ Database connected successfully!\n\n";
    
    // Get total courses count (bypassing global scope)
    $totalCourses = Course::withoutGlobalScopes()->count();
    $publishedCourses = Course::withoutGlobalScopes()->where('is_published', true)->count();
    $unpublishedCourses = Course::withoutGlobalScopes()
        ->where(function ($query) {
            $query->where('is_published', false)
                  ->orWhereNull('is_published');
        })
        ->count();
    
    echo "📊 Courses Summary:\n";
    echo str_repeat("-", 50) . "\n";
    printf("%-30s: %d\n", "Total Courses", $totalCourses);
    printf("%-30s: %d\n", "Published Courses", $publishedCourses);
    printf("%-30s: %d\n", "Unpublished Courses", $unpublishedCourses);
    echo str_repeat("-", 50) . "\n\n";
    
    if ($unpublishedCourses > 0) {
        echo "⚠️  WARNING: Found {$unpublishedCourses} unpublished course(s)\n";
        echo "These courses will return 404 on public routes!\n\n";
        
        echo "📋 Unpublished Courses:\n";
        echo str_repeat("-", 80) . "\n";
        printf("%-5s | %-50s | %-15s\n", "ID", "Title", "Created At");
        echo str_repeat("-", 80) . "\n";
        
        $unpublished = Course::withoutGlobalScopes()
            ->where(function ($query) {
                $query->where('is_published', false)
                      ->orWhereNull('is_published');
            })
            ->select('id', 'title', 'created_at')
            ->get();
        
        foreach ($unpublished as $course) {
            $title = mb_substr($course->title, 0, 50);
            printf("%-5d | %-50s | %-15s\n", 
                $course->id, 
                $title, 
                $course->created_at->format('Y-m-d H:i')
            );
        }
        echo str_repeat("-", 80) . "\n\n";
        
        echo "💡 To fix this, run:\n";
        echo "   php publish_all_courses.php\n";
        echo "   OR\n";
        echo "   php artisan courses:publish-all --force\n\n";
    } else {
        echo "✅ All courses are published!\n";
        echo "The 404 routing issue should not be caused by unpublished courses.\n\n";
    }
    
    // Check if is_published column exists
    echo "🔍 Checking database schema...\n";
    $columns = DB::select("SHOW COLUMNS FROM courses LIKE 'is_published'");
    
    if (empty($columns)) {
        echo "❌ ERROR: 'is_published' column does not exist in courses table!\n";
        echo "Run: php artisan migrate\n\n";
    } else {
        $column = $columns[0];
        echo "✅ 'is_published' column exists\n";
        echo "   Type: {$column->Type}\n";
        echo "   Null: {$column->Null}\n";
        echo "   Default: {$column->Default}\n\n";
    }
    
    // Show sample courses
    echo "📋 Sample Courses (first 5):\n";
    echo str_repeat("-", 100) . "\n";
    printf("%-5s | %-40s | %-12s | %-15s\n", "ID", "Title", "Published", "Created At");
    echo str_repeat("-", 100) . "\n";
    
    $sampleCourses = Course::withoutGlobalScopes()
        ->select('id', 'title', 'is_published', 'created_at')
        ->orderBy('id')
        ->limit(5)
        ->get();
    
    foreach ($sampleCourses as $course) {
        $title = mb_substr($course->title, 0, 40);
        $published = $course->is_published ? 'Yes' : 'No';
        printf("%-5d | %-40s | %-12s | %-15s\n", 
            $course->id, 
            $title, 
            $published,
            $course->created_at->format('Y-m-d H:i')
        );
    }
    echo str_repeat("-", 100) . "\n\n";
    
    // Test route model binding
    echo "🧪 Testing Route Model Binding...\n";
    if ($totalCourses > 0) {
        $firstCourse = Course::withoutGlobalScopes()->first();
        
        echo "Testing with Course ID: {$firstCourse->id}\n";
        
        // Test with global scope (simulating public route)
        try {
            $publicCourse = Course::findOrFail($firstCourse->id);
            echo "✅ Public route binding: SUCCESS\n";
            echo "   Course found: {$publicCourse->title}\n";
        } catch (\Exception $e) {
            echo "❌ Public route binding: FAILED\n";
            echo "   Error: {$e->getMessage()}\n";
            echo "   This course will return 404 on public routes!\n";
        }
        
        // Test without global scope (simulating admin route)
        try {
            $adminCourse = Course::withoutGlobalScopes()->findOrFail($firstCourse->id);
            echo "✅ Admin route binding: SUCCESS\n";
            echo "   Course found: {$adminCourse->title}\n";
        } catch (\Exception $e) {
            echo "❌ Admin route binding: FAILED\n";
            echo "   Error: {$e->getMessage()}\n";
        }
    }
    
    echo "\n";
    echo "=================================================\n";
    echo "  Diagnostic Complete\n";
    echo "=================================================\n";
    
} catch (\Exception $e) {
    echo "\n❌ Error: " . $e->getMessage() . "\n";
    echo "File: " . $e->getFile() . "\n";
    echo "Line: " . $e->getLine() . "\n\n";
    exit(1);
}

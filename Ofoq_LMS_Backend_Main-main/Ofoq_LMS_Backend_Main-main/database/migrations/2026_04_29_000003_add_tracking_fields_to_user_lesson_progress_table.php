<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('user_lesson_progress')) {
            return;
        }

        Schema::table('user_lesson_progress', function (Blueprint $table) {
            if (!Schema::hasColumn('user_lesson_progress', 'progress_percentage')) {
                $table->decimal('progress_percentage', 5, 2)->default(0);
            }
            if (!Schema::hasColumn('user_lesson_progress', 'watch_duration_seconds')) {
                $table->unsignedInteger('watch_duration_seconds')->default(0);
            }
            if (!Schema::hasColumn('user_lesson_progress', 'last_watched_at')) {
                $table->timestamp('last_watched_at')->nullable();
            }
            if (!Schema::hasColumn('user_lesson_progress', 'first_started_at')) {
                $table->timestamp('first_started_at')->nullable();
            }
            if (!Schema::hasColumn('user_lesson_progress', 'completed_by')) {
                $table->string('completed_by')->nullable();
            }
            if (!Schema::hasColumn('user_lesson_progress', 'completion_source')) {
                $table->string('completion_source')->nullable();
            }
            if (!Schema::hasColumn('user_lesson_progress', 'last_position_seconds')) {
                $table->unsignedInteger('last_position_seconds')->default(0);
            }
        });
    }

    public function down(): void
    {
        if (!Schema::hasTable('user_lesson_progress')) {
            return;
        }

        Schema::table('user_lesson_progress', function (Blueprint $table) {
            $columns = [
                'progress_percentage',
                'watch_duration_seconds',
                'last_watched_at',
                'first_started_at',
                'completed_by',
                'completion_source',
                'last_position_seconds',
            ];

            foreach ($columns as $column) {
                if (Schema::hasColumn('user_lesson_progress', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};

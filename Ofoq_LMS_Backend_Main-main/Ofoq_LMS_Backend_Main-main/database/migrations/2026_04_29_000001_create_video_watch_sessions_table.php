<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('video_watch_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('lesson_id')->constrained()->cascadeOnDelete();
            $table->foreignId('course_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('category_id')->nullable()->constrained('category_of_course')->nullOnDelete();
            $table->string('video_guid')->nullable();
            $table->timestamp('started_at');
            $table->timestamp('ended_at')->nullable();
            $table->timestamp('last_event_at')->nullable();
            $table->unsignedInteger('duration_seconds')->default(0);
            $table->unsignedInteger('watched_seconds')->default(0);
            $table->unsignedInteger('max_position_seconds')->default(0);
            $table->decimal('completion_percentage', 5, 2)->default(0);
            $table->boolean('completed')->default(false);
            $table->timestamp('completed_at')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->string('device_id')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'lesson_id']);
            $table->index('lesson_id');
            $table->index('course_id');
            $table->index('category_id');
            $table->index('started_at');
            $table->index('video_guid');
            $table->index('completed');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('video_watch_sessions');
    }
};

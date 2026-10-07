<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('video_watch_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('video_watch_session_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('lesson_id')->constrained()->cascadeOnDelete();
            $table->string('event_type', 32);
            $table->unsignedInteger('position_seconds')->default(0);
            $table->unsignedInteger('duration_seconds')->nullable();
            $table->unsignedInteger('watched_delta_seconds')->nullable();
            $table->decimal('playback_rate', 4, 2)->nullable();
            $table->json('metadata')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['video_watch_session_id', 'created_at'], 'video_watch_events_session_created_idx');
            $table->index(['user_id', 'lesson_id']);
            $table->index('event_type');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('video_watch_events');
    }
};

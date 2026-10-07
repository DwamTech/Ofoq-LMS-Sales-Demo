<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('bunny_video_stats')) {
            return;
        }

        Schema::create('bunny_video_stats', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('lesson_id')->nullable()->index();
            $table->string('video_guid')->unique();
            $table->string('title')->nullable();
            $table->unsignedTinyInteger('status_code')->nullable();
            $table->string('status_label')->nullable();
            $table->unsignedInteger('duration_seconds')->nullable();
            $table->unsignedBigInteger('storage_size_bytes')->nullable();
            $table->unsignedBigInteger('views')->nullable();
            $table->unsignedBigInteger('average_watch_time_seconds')->nullable();
            $table->unsignedBigInteger('total_watch_time_seconds')->nullable();
            $table->string('thumbnail_file_name')->nullable();
            $table->string('thumbnail_url')->nullable();
            $table->string('collection_id')->nullable();
            $table->string('available_resolutions')->nullable();
            $table->string('data_source')->default('bunny_stream_video_details');
            $table->string('accuracy_level')->default('exact');
            $table->string('sync_status')->default('synced');
            $table->json('raw_payload')->nullable();
            $table->timestamp('last_synced_at')->nullable();
            $table->timestamps();

            $table->index(['lesson_id', 'video_guid']);
            $table->index(['sync_status', 'last_synced_at']);
        });
    }

    public function down(): void
    {
        // Intentionally keep reporting tables to avoid data loss in production rollbacks.
    }
};

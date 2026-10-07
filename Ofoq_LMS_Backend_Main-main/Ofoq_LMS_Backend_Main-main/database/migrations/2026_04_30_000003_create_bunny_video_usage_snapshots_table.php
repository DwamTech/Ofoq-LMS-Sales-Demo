<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('bunny_video_usage_snapshots')) {
            return;
        }

        Schema::create('bunny_video_usage_snapshots', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('lesson_id')->nullable()->index();
            $table->string('video_guid');
            $table->dateTime('period_start')->nullable();
            $table->dateTime('period_end')->nullable();
            $table->boolean('hourly')->default(false);
            $table->unsignedBigInteger('total_views')->nullable();
            $table->unsignedBigInteger('total_watch_time_seconds')->nullable();
            $table->decimal('engagement_score', 8, 2)->nullable();
            $table->string('data_source')->default('bunny_stream_video_statistics');
            $table->string('metric_type')->default('video_stream_statistics');
            $table->string('accuracy_level')->default('exact');
            $table->string('sync_status')->default('synced');
            $table->json('views_chart')->nullable();
            $table->json('watch_time_chart')->nullable();
            $table->json('country_view_counts')->nullable();
            $table->json('country_watch_time')->nullable();
            $table->json('unavailable_metrics')->nullable();
            $table->json('raw_payload')->nullable();
            $table->timestamp('last_synced_at')->nullable();
            $table->timestamps();

            $table->index(['video_guid', 'period_start', 'period_end'], 'bunny_video_usage_guid_period_index');
            $table->index(['lesson_id', 'sync_status']);
        });
    }

    public function down(): void
    {
        // Intentionally keep reporting tables to avoid data loss in production rollbacks.
    }
};

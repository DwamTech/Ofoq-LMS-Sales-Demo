<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('bunny_usage_snapshots')) {
            return;
        }

        Schema::create('bunny_usage_snapshots', function (Blueprint $table) {
            $table->id();
            $table->dateTime('period_start')->nullable();
            $table->dateTime('period_end')->nullable();
            $table->boolean('hourly')->default(false);
            $table->unsignedBigInteger('total_views')->nullable();
            $table->unsignedBigInteger('total_watch_time_seconds')->nullable();
            $table->unsignedBigInteger('total_storage_size_bytes')->nullable();
            $table->unsignedBigInteger('traffic_usage_bytes')->nullable();
            $table->unsignedBigInteger('storage_usage_bytes')->nullable();
            $table->unsignedBigInteger('bandwidth_bytes')->nullable();
            $table->unsignedBigInteger('requests_count')->nullable();
            $table->string('data_source')->default('bunny_stream_statistics');
            $table->string('metric_type')->default('library_stream_statistics');
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

            $table->index(['period_start', 'period_end']);
            $table->index(['metric_type', 'sync_status']);
        });
    }

    public function down(): void
    {
        // Intentionally keep reporting tables to avoid data loss in production rollbacks.
    }
};

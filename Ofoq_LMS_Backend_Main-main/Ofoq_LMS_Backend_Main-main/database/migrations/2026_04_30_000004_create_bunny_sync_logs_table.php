<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('bunny_sync_logs')) {
            return;
        }

        Schema::create('bunny_sync_logs', function (Blueprint $table) {
            $table->id();
            $table->string('sync_type');
            $table->string('status')->default('running');
            $table->boolean('dry_run')->default(false);
            $table->unsignedInteger('limit')->nullable();
            $table->unsignedInteger('processed_count')->default(0);
            $table->unsignedInteger('succeeded_count')->default(0);
            $table->unsignedInteger('failed_count')->default(0);
            $table->unsignedInteger('skipped_count')->default(0);
            $table->text('message')->nullable();
            $table->text('error_message')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('finished_at')->nullable();
            $table->unsignedInteger('duration_ms')->nullable();
            $table->timestamps();

            $table->index(['sync_type', 'status']);
            $table->index('started_at');
        });
    }

    public function down(): void
    {
        // Intentionally keep reporting tables to avoid data loss in production rollbacks.
    }
};

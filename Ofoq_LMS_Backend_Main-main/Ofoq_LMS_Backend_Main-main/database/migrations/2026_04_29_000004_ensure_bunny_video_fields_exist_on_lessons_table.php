<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('lessons')) {
            return;
        }

        Schema::table('lessons', function (Blueprint $table) {
            if (!Schema::hasColumn('lessons', 'video_guid')) {
                $table->string('video_guid')->nullable();
            }

            if (!Schema::hasColumn('lessons', 'video_status')) {
                $table->string('video_status')->default('ready');
            }
        });
    }

    public function down(): void
    {
        // Intentionally keep columns to avoid data loss in production rollbacks.
    }
};

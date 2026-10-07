<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
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
                $table->string('video_status')->default('ready'); // processing, ready, failed
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (!Schema::hasTable('lessons')) {
            return;
        }

        Schema::table('lessons', function (Blueprint $table) {
            $columns = [];

            if (Schema::hasColumn('lessons', 'video_guid')) {
                $columns[] = 'video_guid';
            }

            if (Schema::hasColumn('lessons', 'video_status')) {
                $columns[] = 'video_status';
            }

            if (!empty($columns)) {
                $table->dropColumn($columns);
            }
        });
    }
};

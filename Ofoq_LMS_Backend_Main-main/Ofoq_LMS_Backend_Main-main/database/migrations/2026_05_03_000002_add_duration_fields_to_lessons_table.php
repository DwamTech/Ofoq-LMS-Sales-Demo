<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('lessons', function (Blueprint $table) {
            if (!Schema::hasColumn('lessons', 'duration_seconds')) {
                $table->unsignedInteger('duration_seconds')->nullable()->after('video_status');
            }

            if (!Schema::hasColumn('lessons', 'duration_source')) {
                $table->string('duration_source')->nullable()->after('duration_seconds');
            }
        });
    }

    public function down(): void
    {
        Schema::table('lessons', function (Blueprint $table) {
            $columns = [];

            if (Schema::hasColumn('lessons', 'duration_source')) {
                $columns[] = 'duration_source';
            }

            if (Schema::hasColumn('lessons', 'duration_seconds')) {
                $columns[] = 'duration_seconds';
            }

            if ($columns !== []) {
                $table->dropColumn($columns);
            }
        });
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('quizzes', function (Blueprint $table) {
            if (!Schema::hasColumn('quizzes', 'chapter_id')) {
                $table->unsignedBigInteger('chapter_id')->nullable()->after('id');
            }
        });

        // Sanitize invalid references
        // SQLite-compatible version
        DB::statement('UPDATE quizzes SET chapter_id = NULL WHERE chapter_id IS NOT NULL AND chapter_id NOT IN (SELECT id FROM chapters)');

        Schema::table('quizzes', function (Blueprint $table) {
            // Add foreign key if not present
            $table->foreign('chapter_id')->references('id')->on('chapters')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('quizzes', function (Blueprint $table) {
            // Drop foreign key and column if exists
            if (Schema::hasColumn('quizzes', 'chapter_id')) {
                $table->dropForeign(['chapter_id']);
                $table->dropColumn('chapter_id');
            }
        });
    }
};
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('category_of_course') && ! Schema::hasColumn('category_of_course', 'section_id')) {
            Schema::table('category_of_course', function (Blueprint $table) {
                $table->foreignId('section_id')
                    ->nullable()
                    ->constrained('sections')
                    ->nullOnDelete();
            });
        }

        if (Schema::hasTable('courses') && ! Schema::hasColumn('courses', 'section_id')) {
            Schema::table('courses', function (Blueprint $table) {
                $table->foreignId('section_id')
                    ->nullable()
                    ->constrained('sections')
                    ->nullOnDelete();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('courses') && Schema::hasColumn('courses', 'section_id')) {
            Schema::table('courses', function (Blueprint $table) {
                $table->dropConstrainedForeignId('section_id');
            });
        }

        if (Schema::hasTable('category_of_course') && Schema::hasColumn('category_of_course', 'section_id')) {
            Schema::table('category_of_course', function (Blueprint $table) {
                $table->dropConstrainedForeignId('section_id');
            });
        }
    }
};

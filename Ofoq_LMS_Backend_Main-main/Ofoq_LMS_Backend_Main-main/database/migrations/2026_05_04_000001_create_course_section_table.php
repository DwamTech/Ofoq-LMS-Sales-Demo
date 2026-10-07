<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('course_section')) {
            Schema::create('course_section', function (Blueprint $table) {
                $table->id();
                $table->foreignId('course_id')->constrained('courses')->cascadeOnDelete();
                $table->foreignId('section_id')->constrained('sections')->cascadeOnDelete();
                $table->timestamps();
                $table->unique(['course_id', 'section_id']);
            });
        }

        if (Schema::hasColumn('courses', 'section_id')) {
            DB::table('courses')
                ->whereNotNull('section_id')
                ->orderBy('id')
                ->select(['id', 'section_id'])
                ->chunk(500, function ($courses) {
                    foreach ($courses as $course) {
                        DB::table('course_section')->updateOrInsert(
                            [
                                'course_id' => $course->id,
                                'section_id' => $course->section_id,
                            ],
                            [
                                'created_at' => now(),
                                'updated_at' => now(),
                            ]
                        );
                    }
                });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('course_section');
    }
};

<?php

namespace Database\Seeders;

use App\Models\Section;
use Illuminate\Database\Seeder;

class DiplomaSectionsSeeder extends Seeder
{
    public function run(): void
    {
        $sections = [
            ['name' => 'التربوية', 'slug' => 'educational', 'icon' => 'PiChalkboardTeacher', 'display_order' => 1],
            ['name' => 'الدعوية', 'slug' => 'dawah', 'icon' => 'PiMosque', 'display_order' => 2],
            ['name' => 'الإعلامية', 'slug' => 'media', 'icon' => 'PiMegaphone', 'display_order' => 3],
            ['name' => 'الإدارية', 'slug' => 'management', 'icon' => 'PiBriefcase', 'display_order' => 4],
            ['name' => 'الشرعية', 'slug' => 'sharia', 'icon' => 'PiScroll', 'display_order' => 5],
            ['name' => 'تطوير الذات', 'slug' => 'self-development', 'icon' => 'PiHeart', 'display_order' => 6],
            ['name' => 'التقنية', 'slug' => 'tech', 'icon' => 'PiCode', 'display_order' => 7],
            ['name' => 'السلوكية', 'slug' => 'behavioral', 'icon' => 'PiBrain', 'display_order' => 8],
            ['name' => 'المهنية', 'slug' => 'professional', 'icon' => 'PiWrench', 'display_order' => 9],
            ['name' => 'خدمة المجتمع', 'slug' => 'community-service', 'icon' => 'PiHandHeart', 'display_order' => 10],
        ];

        foreach ($sections as $section) {
            Section::updateOrCreate(
                ['slug' => $section['slug']],
                [
                    'name' => $section['name'],
                    'icon' => $section['icon'],
                    'display_order' => $section['display_order'],
                    'is_published' => true,
                ]
            );
        }
    }
};

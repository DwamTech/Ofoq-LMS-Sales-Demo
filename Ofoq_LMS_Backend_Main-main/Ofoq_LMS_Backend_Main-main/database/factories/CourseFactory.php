<?php

namespace Database\Factories;

use App\Models\Course;
use App\Models\CategoryOfCourse;
use Illuminate\Database\Eloquent\Factories\Factory;

class CourseFactory extends Factory
{
    protected $model = Course::class;

    public function definition(): array
    {
        return [
            'title' => $this->faker->sentence(4),
            'description' => $this->faker->paragraph(),
            'is_published' => true,
            'is_free' => false,
            'price' => $this->faker->randomFloat(2, 0, 500),
            'category_id' => CategoryOfCourse::factory(),
        ];
    }
}

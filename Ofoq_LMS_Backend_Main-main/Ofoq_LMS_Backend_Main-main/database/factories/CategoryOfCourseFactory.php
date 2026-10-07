<?php

namespace Database\Factories;

use App\Models\CategoryOfCourse;
use Illuminate\Database\Eloquent\Factories\Factory;

class CategoryOfCourseFactory extends Factory
{
    protected $model = CategoryOfCourse::class;

    public function definition(): array
    {
        return [
            'name' => $this->faker->words(3, true),
            'description' => $this->faker->paragraph(),
            'slug' => $this->faker->unique()->slug(),
            'is_published' => true,
            'is_free' => false,
            'price' => $this->faker->randomFloat(2, 0, 1000),
        ];
    }
}

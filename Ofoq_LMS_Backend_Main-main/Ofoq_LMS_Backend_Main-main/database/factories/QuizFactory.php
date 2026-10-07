<?php

namespace Database\Factories;

use App\Models\Quiz;
use App\Models\Course;
use Illuminate\Database\Eloquent\Factories\Factory;

class QuizFactory extends Factory
{
    protected $model = Quiz::class;

    public function definition(): array
    {
        return [
            'title' => $this->faker->sentence(3),
            'description' => $this->faker->paragraph(),
            'is_final' => false,
            'quizzable_type' => Course::class,
            'quizzable_id' => Course::factory(),
        ];
    }

    public function final(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_final' => true,
        ]);
    }
}

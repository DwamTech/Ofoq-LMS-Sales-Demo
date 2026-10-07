<?php

namespace Database\Factories;

use App\Models\Question;
use App\Models\Quiz;
use Illuminate\Database\Eloquent\Factories\Factory;

class QuestionFactory extends Factory
{
    protected $model = Question::class;

    public function definition(): array
    {
        return [
            'quiz_id' => Quiz::factory(),
            'question' => $this->faker->sentence() . '?',
            'options' => [
                'A' => $this->faker->word(),
                'B' => $this->faker->word(),
                'C' => $this->faker->word(),
                'D' => $this->faker->word(),
            ],
            'correct_answer' => $this->faker->randomElement(['A', 'B', 'C', 'D']),
            'explanation' => $this->faker->sentence(),
        ];
    }
}

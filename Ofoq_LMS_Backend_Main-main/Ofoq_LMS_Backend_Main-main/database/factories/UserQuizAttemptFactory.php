<?php

namespace Database\Factories;

use App\Models\UserQuizAttempt;
use App\Models\User;
use App\Models\Quiz;
use Illuminate\Database\Eloquent\Factories\Factory;

class UserQuizAttemptFactory extends Factory
{
    protected $model = UserQuizAttempt::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'quiz_id' => Quiz::factory(),
            'status' => 'in_progress',
            'start_time' => now(),
            'end_time' => null,
            'score' => null,
        ];
    }

    public function completed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'completed',
            'end_time' => now(),
            'score' => $this->faker->numberBetween(0, 100),
        ]);
    }

    public function inProgress(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'in_progress',
            'end_time' => null,
            'score' => null,
        ]);
    }
}

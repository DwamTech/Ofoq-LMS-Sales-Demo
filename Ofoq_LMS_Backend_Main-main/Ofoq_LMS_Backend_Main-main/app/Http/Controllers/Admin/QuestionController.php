<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\QuestionResource;
use App\Models\Question;
use App\Models\Quiz;
use Illuminate\Http\Request;

class QuestionController extends Controller
{
    private const MIN_OPTIONS = 2;
    private const MAX_OPTIONS = 6;

    public function index(Quiz $quiz)
    {
        return QuestionResource::collection($quiz->questions()->latest()->get());
    }

    public function store(Request $request, Quiz $quiz)
    {
        $validated = $request->validate([
            'question' => 'required|string',
            'options' => 'required|array|min:2|max:6',
            'options.*' => 'required|string',
            'correct_answer' => 'required',
            'explanation' => 'nullable|string',
        ]);

        $normalized = $this->normalizeOptionsAndCorrectAnswer($validated['options'], $validated['correct_answer']);
        if (! $normalized['valid']) {
            return response()->json(['message' => $normalized['message']], 422);
        }

        $question = $quiz->questions()->create([
            'question' => $validated['question'],
            'options' => $normalized['options'],
            'correct_answer' => $normalized['correct_answer'],
            'explanation' => $validated['explanation'] ?? null,
        ]);

        return new QuestionResource($question);
    }

    public function show(Question $question)
    {
        return new QuestionResource($question);
    }

    public function update(Request $request, Question $question)
    {
        $validated = $request->validate([
            'question' => 'sometimes|required|string',
            'options' => 'sometimes|required|array|min:2|max:6',
            'options.*' => 'required_with:options|string',
            'correct_answer' => 'sometimes|required',
            'explanation' => 'nullable|string',
        ]);

        $payload = [];

        if (array_key_exists('question', $validated)) {
            $payload['question'] = $validated['question'];
        }

        if (array_key_exists('options', $validated)) {
            $correctAnswer = $validated['correct_answer'] ?? $question->correct_answer;
            $normalized = $this->normalizeOptionsAndCorrectAnswer($validated['options'], $correctAnswer);

            if (! $normalized['valid']) {
                return response()->json(['message' => $normalized['message']], 422);
            }

            $payload['options'] = $normalized['options'];
            $payload['correct_answer'] = $normalized['correct_answer'];
        } elseif (array_key_exists('correct_answer', $validated)) {
            $currentOptions = is_array($question->options)
                ? $question->options
                : (json_decode($question->options, true) ?? []);
            $normalized = $this->normalizeOptionsAndCorrectAnswer($currentOptions, $validated['correct_answer']);

            if (! $normalized['valid']) {
                return response()->json(['message' => $normalized['message']], 422);
            }

            $payload['correct_answer'] = $normalized['correct_answer'];
        }

        if (array_key_exists('explanation', $validated)) {
            $payload['explanation'] = $validated['explanation'];
        }

        $question->update($payload);

        return new QuestionResource($question);
    }

    public function destroy(Question $question)
    {
        $question->delete();

        return response()->noContent();
    }

    private function normalizeOptionsAndCorrectAnswer(array $optionsInput, mixed $correctAnswer): array
    {
        $options = array_values(array_map(function ($option) {
            return is_string($option) ? trim($option) : (string) $option;
        }, array_filter($optionsInput, function ($option) {
            return ! is_null($option) && trim((string) $option) !== '';
        })));

        if (count($options) < self::MIN_OPTIONS || count($options) > self::MAX_OPTIONS) {
            return [
                'valid' => false,
                'message' => 'Options must contain between 2 and 6 non-empty answers',
            ];
        }

        if (is_numeric($correctAnswer)) {
            $index = (int) $correctAnswer;
            if (! array_key_exists($index, $options)) {
                return [
                    'valid' => false,
                    'message' => 'Correct answer index is out of range',
                ];
            }

            return [
                'valid' => true,
                'options' => $options,
                'correct_answer' => (string) $index,
            ];
        }

        $index = array_search((string) $correctAnswer, $options, true);
        if ($index === false) {
            return [
                'valid' => false,
                'message' => 'Correct answer text must match one of the provided options',
            ];
        }

        return [
            'valid' => true,
            'options' => $options,
            'correct_answer' => (string) $index,
        ];
    }
}

<?php

namespace App\Http\Controllers;

use App\Models\Question;
use App\Models\Quiz;
use App\Http\Requests\QuestionRequest;
use App\Http\Resources\QuestionResource;
use Illuminate\Http\Request;

class QuestionController extends Controller
{
    private const MIN_OPTIONS = 2;
    private const MAX_OPTIONS = 6;

    /**
     * Store a newly created question
     */
    public function store(QuestionRequest $request, $quiz_id)
    {
        $quiz = Quiz::find($quiz_id);
        
        if (!$quiz) {
            return response()->json([
                'message' => 'Quiz not found'
            ], 404);
        }

        $data = $request->validated();
        $normalized = $this->normalizeOptionsAndCorrectAnswer($data['options'], $data['correct_answer']);
        if (! $normalized['valid']) {
            return response()->json([
                'message' => $normalized['message'],
            ], 422);
        }

        $data['options'] = $normalized['options'];
        $data['correct_answer'] = $normalized['correct_answer'];
        $data['quiz_id'] = $quiz_id;

        $question = Question::create($data);

        return response()->json([
            'message' => 'Question created successfully',
            'question' => new QuestionResource($question)
        ], 201);
    }

    /**
     * Update the specified question
     */
    public function update(QuestionRequest $request, $id)
    {
        $question = Question::find($id);
        
        if (!$question) {
            return response()->json([
                'message' => 'Question not found'
            ], 404);
        }

        $data = $request->validated();
        if (array_key_exists('options', $data)) {
            $correctAnswer = $data['correct_answer'] ?? $question->correct_answer;
            $normalized = $this->normalizeOptionsAndCorrectAnswer($data['options'], $correctAnswer);
            if (! $normalized['valid']) {
                return response()->json([
                    'message' => $normalized['message'],
                ], 422);
            }

            $data['options'] = $normalized['options'];
            $data['correct_answer'] = $normalized['correct_answer'];
        } elseif (array_key_exists('correct_answer', $data)) {
            $currentOptions = is_array($question->options)
                ? $question->options
                : (json_decode($question->options, true) ?? []);
            $normalized = $this->normalizeOptionsAndCorrectAnswer($currentOptions, $data['correct_answer']);
            if (! $normalized['valid']) {
                return response()->json([
                    'message' => $normalized['message'],
                ], 422);
            }

            $data['correct_answer'] = $normalized['correct_answer'];
        }

        $question->update($data);

        return response()->json([
            'message' => 'Question updated successfully',
            'question' => new QuestionResource($question)
        ]);
    }

    /**
     * Remove the specified question
     */
    public function destroy($id)
    {
        $question = Question::find($id);
        
        if (!$question) {
            return response()->json([
                'message' => 'Question not found'
            ], 404);
        }

        $question->delete();

        return response()->json([
            'message' => 'Question deleted successfully'
        ]);
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

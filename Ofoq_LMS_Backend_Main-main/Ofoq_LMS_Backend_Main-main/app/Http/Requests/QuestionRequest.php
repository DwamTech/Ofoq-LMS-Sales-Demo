<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class QuestionRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user() && $this->user()->role === 'admin';
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $rules = [
            'question' => 'required|string',
            'options' => 'required|array|min:2|max:6',
            'options.*' => 'required|string',
            'correct_answer' => 'required',
            'explanation' => 'nullable|string',
        ];

        // For update requests, make fields optional
        if ($this->isMethod('PUT') || $this->isMethod('PATCH')) {
            $rules = array_map(function ($rule) {
                return str_replace('required|', 'sometimes|', $rule);
            }, $rules);
            // Keep options rule consistent
            $rules['options'] = 'sometimes|required|array|min:2|max:6';
            $rules['options.*'] = 'required_with:options|string';
        }

        return $rules;
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            if (! $this->has('options') || ! $this->has('correct_answer')) {
                return;
            }

            $options = array_values(array_filter((array) $this->input('options', []), function ($option) {
                return ! is_null($option) && trim((string) $option) !== '';
            }));

            $correctAnswer = $this->input('correct_answer');

            if (is_numeric($correctAnswer)) {
                if (! array_key_exists((int) $correctAnswer, $options)) {
                    $validator->errors()->add('correct_answer', 'Correct answer must be one of the provided options');
                }
                return;
            }

            if (! in_array((string) $correctAnswer, $options, true)) {
                $validator->errors()->add('correct_answer', 'Correct answer must be one of the provided options');
            }
        });
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'question_text.required' => 'Question text is required',
            'question_type.required' => 'Question type is required',
            'question_type.in' => 'Question type must be multiple_choice, true_false, or short_answer',
            'options.required' => 'Options are required',
            'options.array' => 'Options must be an array',
            'options.min' => 'Options must contain at least 2 items',
            'options.max' => 'Options must not exceed 6 items',
            'options.*.required' => 'Option text is required',
            'correct_answer.required' => 'Correct answer is required',
            'points.required' => 'Points are required',
            'points.integer' => 'Points must be a number',
            'points.min' => 'Points must be at least 1',
        ];
    }
}

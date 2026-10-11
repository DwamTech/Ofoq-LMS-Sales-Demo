<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ExamQuestionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $options = $this->options;
        if (is_string($options)) {
            $options = json_decode($options, true);
        }

        // Preserve every option's index used by the existing scoring logic.
        // Never send answer keys, explanations or relation pivots to the examinee.
        return [
            'id' => $this->id,
            'question' => $this->question,
            'options' => array_map(fn ($option) => is_string($option) ? $option : (is_array($option) ? (string) ($option['text'] ?? $option['label'] ?? '') : ''), is_array($options) ? array_values($options) : []),
        ];
    }
}

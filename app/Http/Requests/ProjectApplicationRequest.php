<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ProjectApplicationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if (! $this->has('submit')) {
            $this->merge(['submit' => true]);
        }
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'submit' => ['required', 'boolean'],
            'answers' => ['present', 'array', 'max:100'],
            'files' => ['nullable', 'array', 'max:30'],
            'files.*' => ['file', 'max:20480'],
        ];
    }
}

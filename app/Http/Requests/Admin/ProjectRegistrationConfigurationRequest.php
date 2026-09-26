<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class ProjectRegistrationConfigurationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('update', $this->route('project')) === true;
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'title' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:10000'],
            'instructions' => ['nullable', 'string', 'max:50000'],
            'max_applications' => ['nullable', 'integer', 'min:1', 'max:10000000'],
            'allow_editing' => ['required', 'boolean'],
            'edit_deadline' => ['nullable', 'date'],
            'requires_authentication' => ['required', 'boolean'],
            'one_per_user' => ['required', 'boolean'],
            'success_message' => ['nullable', 'string', 'max:10000'],
            'confirmation_message' => ['nullable', 'string', 'max:10000'],
        ];
    }
}

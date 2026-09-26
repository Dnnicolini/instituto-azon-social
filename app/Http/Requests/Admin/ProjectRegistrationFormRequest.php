<?php

namespace App\Http\Requests\Admin;

use App\Models\ProjectRegistrationField;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ProjectRegistrationFormRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('update', $this->route('project')) === true;
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'fields' => ['present', 'array', 'max:100'],
            'fields.*.type' => ['required', Rule::in(ProjectRegistrationField::TYPES)],
            'fields.*.label' => ['required', 'string', 'max:255'],
            'fields.*.identifier' => ['required', 'string', 'regex:/^[a-z][a-z0-9_]*$/', 'max:80', 'distinct'],
            'fields.*.description' => ['nullable', 'string', 'max:2000'],
            'fields.*.placeholder' => ['nullable', 'string', 'max:255'],
            'fields.*.required' => ['required', 'boolean'],
            'fields.*.sort_order' => ['required', 'integer', 'min:0', 'max:10000'],
            'fields.*.options' => ['nullable', 'array', 'max:200'],
            'fields.*.options.*' => ['string', 'max:255', 'distinct'],
            'fields.*.validations' => ['nullable', 'array'],
            'fields.*.max_length' => ['nullable', 'integer', 'min:1', 'max:100000'],
            'fields.*.allowed_mime_types' => ['nullable', 'array', 'max:20'],
            'fields.*.allowed_mime_types.*' => ['string', Rule::in(['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'])],
            'fields.*.max_file_size_kb' => ['nullable', 'integer', 'min:1', 'max:20480'],
            'fields.*.min_value' => ['nullable', 'numeric'],
            'fields.*.max_value' => ['nullable', 'numeric', 'gte:fields.*.min_value'],
        ];
    }
}

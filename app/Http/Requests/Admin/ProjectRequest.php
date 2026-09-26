<?php

namespace App\Http\Requests\Admin;

use App\Enums\ProjectRegistrationType;
use App\Models\Project;
use Illuminate\Validation\Rule;

class ProjectRequest extends ContentRequest
{
    protected function modelClass(): string
    {
        return Project::class;
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'alpha_dash:ascii', 'max:255', Rule::unique('projects', 'slug')->ignore($this->route('project'))],
            'summary' => ['nullable', 'string', 'max:1000'],
            'badge_label' => ['required', 'string', 'max:80'],
            'body' => ['nullable', 'string', 'max:100000'],
            'status' => $this->statusRules(),
            'published_at' => ['nullable', 'date'],
            'sort_order' => ['required', 'integer', 'min:0', 'max:10000'],
            'cover' => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp', 'mimetypes:image/jpeg,image/png,image/webp', 'max:5120', 'dimensions:max_width=5000,max_height=5000'],
            'cover_alt' => ['nullable', 'string', 'max:255', 'required_with:cover'],
            'gallery' => ['nullable', 'array', 'max:10'],
            'gallery.*' => ['file', 'mimes:jpg,jpeg,png,webp', 'mimetypes:image/jpeg,image/png,image/webp', 'max:5120', 'dimensions:max_width=5000,max_height=5000'],
            'remove_gallery_ids' => ['nullable', 'array', 'max:20'],
            'remove_gallery_ids.*' => ['integer', 'distinct', 'min:1'],
            'registration_enabled' => ['sometimes', 'boolean'],
            'registration_type' => ['nullable', Rule::enum(ProjectRegistrationType::class), 'required_if:registration_enabled,1'],
            'registration_url' => ['nullable', 'url:https', 'max:2048', 'required_if:registration_type,external'],
            'registration_start_at' => ['nullable', 'date'],
            'registration_end_at' => ['nullable', 'date', 'after:registration_start_at'],
            'registration_instructions' => ['nullable', 'string', 'max:10000'],
            'registration_button_label' => ['nullable', 'string', 'max:80'],
            'registration_title' => ['nullable', 'string', 'max:255'],
            'registration_description' => ['nullable', 'string', 'max:10000'],
            'registration_max_applications' => ['nullable', 'integer', 'min:1', 'max:10000000'],
            'registration_allow_editing' => ['sometimes', 'boolean'],
            'registration_edit_deadline' => ['nullable', 'date'],
            'registration_requires_authentication' => ['sometimes', 'boolean'],
            'registration_one_per_user' => ['sometimes', 'boolean'],
            'registration_success_message' => ['nullable', 'string', 'max:10000'],
            'registration_confirmation_message' => ['nullable', 'string', 'max:10000'],
        ];
    }
}

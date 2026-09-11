<?php

namespace App\Http\Requests\Admin;

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
        ];
    }
}

<?php

namespace App\Http\Requests\Admin;

use App\Models\Page;
use Illuminate\Validation\Rule;

class PageRequest extends ContentRequest
{
    protected function modelClass(): string
    {
        return Page::class;
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'alpha_dash:ascii', 'max:255', Rule::unique('pages', 'slug')->ignore($this->route('page'))],
            'body' => ['nullable', 'string', 'max:100000'],
            'sections' => ['nullable', 'array', 'max:20'],
            'sections.*' => ['required', 'array:type,eyebrow,title,emphasis,text,cta_label,cta_url'],
            'sections.*.type' => ['required', Rule::in(['hero', 'intro', 'history', 'transparency', 'participate', 'text'])],
            'sections.*.eyebrow' => ['nullable', 'string', 'max:120'],
            'sections.*.title' => ['required', 'string', 'max:255'],
            'sections.*.emphasis' => ['nullable', 'string', 'max:255'],
            'sections.*.text' => ['nullable', 'string', 'max:5000'],
            'sections.*.cta_label' => ['nullable', 'string', 'max:100'],
            'sections.*.cta_url' => ['nullable', 'string', 'max:2048', 'regex:/^(\/|#|https:\/\/)/'],
            'status' => $this->statusRules(),
            'published_at' => ['nullable', 'date'],
            'seo_title' => ['nullable', 'string', 'max:70'],
            'seo_description' => ['nullable', 'string', 'max:170'],
        ];
    }
}

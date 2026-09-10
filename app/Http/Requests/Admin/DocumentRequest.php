<?php

namespace App\Http\Requests\Admin;

use App\Models\Document;
use Illuminate\Validation\Rule;

class DocumentRequest extends ContentRequest
{
    protected function modelClass(): string
    {
        return Document::class;
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'alpha_dash:ascii', 'max:255', Rule::unique('documents', 'slug')->ignore($this->route('document'))],
            'description' => ['nullable', 'string', 'max:2000'],
            'category' => ['nullable', 'string', 'max:100'],
            'status' => $this->statusRules(),
            'published_at' => ['nullable', 'date'],
            'file' => [$this->route('document') ? 'nullable' : 'required', 'file', 'mimes:pdf', 'mimetypes:application/pdf', 'max:15360'],
        ];
    }
}

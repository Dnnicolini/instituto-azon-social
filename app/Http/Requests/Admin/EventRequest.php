<?php

namespace App\Http\Requests\Admin;

use App\Models\Event;
use Illuminate\Validation\Rule;

class EventRequest extends ContentRequest
{
    protected function modelClass(): string
    {
        return Event::class;
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'alpha_dash:ascii', 'max:255', Rule::unique('events', 'slug')->ignore($this->route('event'))],
            'summary' => ['nullable', 'string', 'max:1000'],
            'body' => ['nullable', 'string', 'max:100000'],
            'location' => ['required', 'string', 'max:255'],
            'starts_at' => ['nullable', 'date'],
            'ends_at' => ['nullable', 'date', 'after:starts_at'],
            'date_label' => ['nullable', 'string', 'max:100'],
            'registration_url' => ['nullable', 'url:http,https,mailto', 'max:2048'],
            'status' => $this->statusRules(),
            'published_at' => ['nullable', 'date'],
            'cover' => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp', 'mimetypes:image/jpeg,image/png,image/webp', 'max:5120'],
            'cover_alt' => ['nullable', 'string', 'max:255', 'required_with:cover'],
        ];
    }
}

<?php

namespace App\Http\Requests\Admin;

use App\Models\Event;
use Illuminate\Validation\Rule;

class EventRequest extends ContentRequest
{
    protected function prepareForValidation(): void
    {
        parent::prepareForValidation();

        if ($this->has('registration_url')) {
            $this->merge(['registration_url' => trim((string) $this->input('registration_url')) ?: null]);
        }
    }

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
            'registration_url' => [
                'nullable',
                'string',
                'max:2048',
                function (string $attribute, mixed $value, \Closure $fail): void {
                    $url = (string) $value;
                    $isInternalPath = preg_match('#^/(?!/)[^\s\\\\]*$#u', $url) === 1;
                    $scheme = strtolower((string) parse_url($url, PHP_URL_SCHEME));
                    $isExternalUrl = in_array($scheme, ['http', 'https'], true) && filter_var($url, FILTER_VALIDATE_URL) !== false;

                    if (! $isInternalPath && ! $isExternalUrl) {
                        $fail('Informe uma URL completa com http/https ou um caminho interno iniciado por /, como /eventos/inscricao.');
                    }
                },
            ],
            'participation_details' => ['nullable', 'string', 'max:5000'],
            'status' => $this->statusRules(),
            'published_at' => ['nullable', 'date'],
            'cover' => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp', 'mimetypes:image/jpeg,image/png,image/webp', 'max:5120', 'dimensions:max_width=5000,max_height=5000'],
            'cover_alt' => ['nullable', 'string', 'max:255', 'required_with:cover'],
        ];
    }

    /** @return array<string, string> */
    public function attributes(): array
    {
        return [
            'registration_url' => 'link para inscrição',
        ];
    }
}

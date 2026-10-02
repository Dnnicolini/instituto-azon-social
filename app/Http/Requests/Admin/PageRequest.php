<?php

namespace App\Http\Requests\Admin;

use App\Models\Page;
use App\Support\ChannelCatalog;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

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
            'social_integration_id' => [
                'nullable',
                'integer',
                Rule::exists('social_integrations', 'id')->where('provider', 'instagram'),
                Rule::unique('pages', 'social_integration_id')->ignore($this->route('page')),
            ],
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
            'return_to' => ['nullable', Rule::in(['pages', 'channels'])],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $page = $this->route('page');
            if ($page instanceof Page && ChannelCatalog::contains($page->slug) && $this->string('slug')->toString() !== $page->slug) {
                $validator->errors()->add('slug', 'O endereço de uma página de canal é estrutural e não pode ser alterado.');
            }

            $targetSlug = $page instanceof Page ? $page->slug : $this->string('slug')->toString();
            if (! ChannelCatalog::contains($targetSlug) && $this->filled('social_integration_id')) {
                $validator->errors()->add('social_integration_id', 'Perfis do Instagram só podem ser vinculados às páginas de canais.');
            }
        });
    }
}

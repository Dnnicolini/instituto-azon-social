<?php

namespace App\Http\Requests\Admin;

use App\Enums\PostType;
use App\Models\Post;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class PostRequest extends ContentRequest
{
    protected function modelClass(): string
    {
        return Post::class;
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        $post = $this->route('post');

        return [
            'type' => ['required', Rule::enum(PostType::class)],
            'title' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'alpha_dash:ascii', 'max:255', Rule::unique('posts', 'slug')->ignore($post)],
            'excerpt' => ['nullable', 'string', 'max:1000'],
            'body' => ['nullable', 'string', 'max:100000'],
            'provider' => ['nullable', 'string', 'max:40', Rule::in(['youtube', 'vimeo', 'spotify', 'anchor', 'instagram', 'other']), 'required_if:type,vlog,video,podcast,social'],
            'external_url' => ['nullable', 'url:https', 'max:2048', 'required_if:type,vlog,video,podcast,social'],
            'duration_seconds' => ['nullable', 'integer', 'min:1', 'max:86400'],
            'is_featured' => ['sometimes', 'boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0', 'max:9999'],
            'status' => $this->statusRules(),
            'published_at' => ['nullable', 'date'],
            'seo_title' => ['nullable', 'string', 'max:70'],
            'seo_description' => ['nullable', 'string', 'max:170'],
            'cover' => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp', 'mimetypes:image/jpeg,image/png,image/webp', 'max:5120', 'dimensions:min_width=400,min_height=225,max_width=5000,max_height=5000'],
            'cover_alt' => ['nullable', 'string', 'max:255', 'required_with:cover'],
        ];
    }

    /** @return array<int, callable> */
    public function after(): array
    {
        return [
            ...parent::after(),
            function (Validator $validator): void {
                $provider = $this->string('provider')->toString();
                $host = strtolower((string) parse_url($this->string('external_url')->toString(), PHP_URL_HOST));
                $allowedHosts = [
                    'youtube' => ['youtube.com', 'www.youtube.com', 'youtu.be'],
                    'vimeo' => ['vimeo.com', 'www.vimeo.com', 'player.vimeo.com'],
                    'spotify' => ['open.spotify.com', 'www.open.spotify.com'],
                    'instagram' => ['instagram.com', 'www.instagram.com'],
                ];

                if (isset($allowedHosts[$provider]) && ! in_array($host, $allowedHosts[$provider], true)) {
                    $validator->errors()->add('external_url', 'O endereço não corresponde à plataforma selecionada.');
                }

                if ($this->string('type')->toString() === PostType::Social->value) {
                    if ($provider !== 'instagram') {
                        $validator->errors()->add('provider', 'Publicações sociais devem usar o Instagram.');
                    }

                    $path = (string) parse_url($this->string('external_url')->toString(), PHP_URL_PATH);
                    if (! preg_match('#/(?:p|reel)/[A-Za-z0-9_-]+/?$#', $path)) {
                        $validator->errors()->add('external_url', 'Informe o link direto de uma publicação ou reel do Instagram.');
                    }
                }
            },
        ];
    }
}

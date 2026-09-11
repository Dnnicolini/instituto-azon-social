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
            'provider' => ['nullable', 'string', 'max:40', Rule::in(['youtube', 'vimeo', 'spotify', 'anchor', 'instagram', 'other'])],
            'external_url' => ['nullable', 'url:https', 'max:2048'],
            'video' => ['nullable', 'file', 'mimes:mp4,mov,webm', 'mimetypes:video/mp4,video/quicktime,video/webm', 'max:204800'],
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
                $externalUrl = $this->string('external_url')->toString();
                $host = strtolower((string) parse_url($externalUrl, PHP_URL_HOST));
                $type = $this->string('type')->toString();
                $hasUploadedVideo = $this->hasFile('video') || ($this->route('post') instanceof Post && $this->route('post')->video_media_id !== null);
                $allowedHosts = [
                    'youtube' => ['youtube.com', 'www.youtube.com', 'youtu.be'],
                    'vimeo' => ['vimeo.com', 'www.vimeo.com', 'player.vimeo.com'],
                    'spotify' => ['open.spotify.com', 'www.open.spotify.com'],
                    'instagram' => ['instagram.com', 'www.instagram.com'],
                ];

                if ($externalUrl !== '' && isset($allowedHosts[$provider]) && ! in_array($host, $allowedHosts[$provider], true)) {
                    $validator->errors()->add('external_url', 'O endereço não corresponde à plataforma selecionada.');
                }

                if (in_array($type, [PostType::Vlog->value, PostType::Video->value], true) && ! $hasUploadedVideo && $externalUrl === '') {
                    $validator->errors()->add('video', 'Envie um vídeo ou informe uma URL externa compatível.');
                }

                if ($type === PostType::Podcast->value && ($provider === '' || $externalUrl === '')) {
                    $validator->errors()->add('external_url', 'Informe a plataforma e a URL externa do episódio.');
                }

                if ($this->hasFile('video') && ! in_array($type, [PostType::Vlog->value, PostType::Video->value], true)) {
                    $validator->errors()->add('video', 'O upload de vídeo está disponível somente para Vlogs e Vídeos.');
                }

                if ($externalUrl !== '' && in_array($type, [PostType::Vlog->value, PostType::Video->value, PostType::Podcast->value], true) && $provider === '') {
                    $validator->errors()->add('provider', 'Selecione a plataforma da URL externa.');
                }

                if ($type === PostType::Social->value) {
                    if ($provider !== 'instagram') {
                        $validator->errors()->add('provider', 'Publicações sociais devem usar o Instagram.');
                    }

                    if ($externalUrl === '') {
                        $validator->errors()->add('external_url', 'Informe o link direto da publicação do Instagram.');
                    }

                    $path = (string) parse_url($externalUrl, PHP_URL_PATH);
                    if (! preg_match('#/(?:p|reel)/[A-Za-z0-9_-]+/?$#', $path)) {
                        $validator->errors()->add('external_url', 'Informe o link direto de uma publicação ou reel do Instagram.');
                    }
                }
            },
        ];
    }
}

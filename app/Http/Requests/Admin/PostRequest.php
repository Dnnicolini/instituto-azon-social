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
            'source_mode' => ['nullable', 'string', Rule::in(['upload', 'link'])],
            'provider' => ['nullable', 'string', 'max:40', Rule::in(['instagram', 'facebook', 'youtube', 'vimeo', 'spotify', 'tiktok', 'linkedin', 'anchor', 'other'])],
            'external_url' => ['nullable', 'url:https', 'max:2048'],
            'video' => ['nullable', 'file', 'mimes:mp4,mov,webm,mp3,m4a,wav,ogg', 'mimetypes:video/mp4,video/quicktime,video/webm,audio/mpeg,audio/mp4,audio/x-m4a,audio/wav,audio/x-wav,audio/ogg,application/ogg', 'max:204800'],
            'duration_seconds' => ['nullable', 'integer', 'min:1', 'max:86400'],
            'is_featured' => ['sometimes', 'boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0', 'max:9999'],
            'status' => $this->statusRules(),
            'published_at' => ['nullable', 'date'],
            'cover' => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp', 'mimetypes:image/jpeg,image/png,image/webp', 'max:5120', 'dimensions:min_width=400,min_height=225,max_width=5000,max_height=5000'],
            'cover_alt' => ['nullable', 'string', 'max:255', 'required_with:cover'],
            'gallery' => ['nullable', 'array', 'max:10'],
            'gallery.*' => ['file', 'mimes:jpg,jpeg,png,webp', 'mimetypes:image/jpeg,image/png,image/webp', 'max:5120', 'dimensions:min_width=400,min_height=225,max_width=5000,max_height=5000'],
            'gallery_cover_id' => ['nullable', 'integer', 'min:1'],
            'remove_gallery_ids' => ['nullable', 'array', 'max:20'],
            'remove_gallery_ids.*' => ['integer', 'distinct', 'min:1'],
            'project_ids' => ['nullable', 'array', 'max:20'],
            'project_ids.*' => ['integer', 'distinct', Rule::exists('projects', 'id')],
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
                $post = $this->route('post');
                $hasStoredUpload = $post instanceof Post && $post->video_media_id !== null;
                $hasNewUpload = $this->hasFile('video');
                $hasUpload = $hasNewUpload || $hasStoredUpload;
                $storedMimeType = $hasStoredUpload ? $post->video?->mime_type : null;
                $sourceMode = $this->sourceMode($externalUrl, $hasUpload);
                $mediaTypes = [PostType::Vlog->value, PostType::Video->value, PostType::Podcast->value];
                $allowedHosts = [
                    'youtube' => ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be'],
                    'vimeo' => ['vimeo.com', 'www.vimeo.com', 'player.vimeo.com'],
                    'spotify' => ['open.spotify.com', 'www.open.spotify.com'],
                    'anchor' => ['anchor.fm', 'www.anchor.fm', 'podcasters.spotify.com'],
                    'instagram' => ['instagram.com', 'www.instagram.com'],
                    'facebook' => ['facebook.com', 'www.facebook.com', 'm.facebook.com', 'fb.watch'],
                    'tiktok' => ['tiktok.com', 'www.tiktok.com', 'm.tiktok.com', 'vm.tiktok.com'],
                    'linkedin' => ['linkedin.com', 'www.linkedin.com'],
                ];

                if ($externalUrl !== '' && isset($allowedHosts[$provider]) && ! in_array($host, $allowedHosts[$provider], true)) {
                    $validator->errors()->add('external_url', 'O endereço não corresponde à plataforma selecionada.');
                }

                if (in_array($type, $mediaTypes, true)) {
                    $this->validateMediaSource($validator, $type, $sourceMode, $provider, $externalUrl, $hasUpload, $hasNewUpload, $storedMimeType);
                } elseif ($hasNewUpload) {
                    $validator->errors()->add('video', 'Arquivos de mídia só podem ser enviados em Vlogs, Vídeos ou Podcasts.');
                }

                if ($type === PostType::Social->value) {
                    if ($sourceMode !== 'link') {
                        $validator->errors()->add('source_mode', 'Publicações de rede social devem usar o link direto da publicação.');
                    }

                    if (! in_array($provider, ['instagram', 'facebook', 'tiktok', 'linkedin'], true)) {
                        $validator->errors()->add('provider', 'Selecione Instagram, Facebook, TikTok ou LinkedIn.');
                    }

                    if ($externalUrl === '') {
                        $validator->errors()->add('external_url', 'Informe o link direto da publicação.');
                    }

                    if ($externalUrl !== '' && ! $this->isDirectSocialPostUrl($provider, $externalUrl)) {
                        $validator->errors()->add('external_url', 'Informe o link direto de uma publicação da rede selecionada.');
                    }
                }
            },
        ];
    }

    private function sourceMode(string $externalUrl, bool $hasUpload): string
    {
        $sourceMode = $this->string('source_mode')->toString();
        if ($sourceMode !== '') {
            return $sourceMode;
        }

        if ($externalUrl !== '') {
            return 'link';
        }

        return $hasUpload ? 'upload' : '';
    }

    private function validateMediaSource(
        Validator $validator,
        string $type,
        string $sourceMode,
        string $provider,
        string $externalUrl,
        bool $hasUpload,
        bool $hasNewUpload,
        ?string $storedMimeType,
    ): void {
        if ($sourceMode === '') {
            $validator->errors()->add('source_mode', 'Escolha enviar um arquivo ou informar um link.');

            return;
        }

        if ($sourceMode === 'upload') {
            if (! $hasUpload) {
                $validator->errors()->add('video', $type === PostType::Podcast->value
                    ? 'Envie o arquivo de áudio do episódio.'
                    : 'Envie o arquivo de vídeo.');
            }
            if ($externalUrl !== '') {
                $validator->errors()->add('external_url', 'Remova o link para usar um arquivo enviado.');
            }
            if ($provider !== '') {
                $validator->errors()->add('provider', 'A plataforma só deve ser informada quando a origem for um link.');
            }
        }

        if ($sourceMode === 'link') {
            if ($hasNewUpload) {
                $validator->errors()->add('video', 'Remova o arquivo para usar um link externo.');
            }
            if ($externalUrl === '') {
                $validator->errors()->add('external_url', 'Informe o link da mídia.');
            }
            if ($provider === '') {
                $validator->errors()->add('provider', 'Selecione a plataforma do link.');
            }
        }

        if ($sourceMode !== 'upload') {
            return;
        }

        $mimeType = strtolower((string) ($hasNewUpload
            ? $this->file('video')?->getMimeType()
            : $storedMimeType));
        $isAudio = str_starts_with($mimeType, 'audio/') || $mimeType === 'application/ogg';
        $isVideo = str_starts_with($mimeType, 'video/');

        if ($type === PostType::Podcast->value && ! $isAudio) {
            $validator->errors()->add('video', 'O arquivo do podcast deve ser um áudio MP3, M4A, WAV ou OGG.');
        }
        if (in_array($type, [PostType::Vlog->value, PostType::Video->value], true) && ! $isVideo) {
            $validator->errors()->add('video', 'Envie um vídeo MP4, MOV ou WebM.');
        }
    }

    private function isDirectSocialPostUrl(string $provider, string $url): bool
    {
        $path = rawurldecode((string) parse_url($url, PHP_URL_PATH));
        $query = [];
        parse_str((string) parse_url($url, PHP_URL_QUERY), $query);

        return match ($provider) {
            'instagram' => (bool) preg_match('#^/(?:p|reel|reels|tv)/[A-Za-z0-9_-]+/?$#', $path),
            'facebook' => (bool) preg_match('#/(?:posts|videos|reel|share/(?:p|r|v))/[^/]+/?$#i', $path)
                || (strtolower($path) === '/story.php' && isset($query['story_fbid']))
                || (strtolower((string) parse_url($url, PHP_URL_HOST)) === 'fb.watch' && (bool) preg_match('#^/[A-Za-z0-9_-]+/?$#', $path)),
            'tiktok' => (bool) preg_match('#^/@[A-Za-z0-9._-]+/video/[0-9]+/?$#', $path),
            'linkedin' => (bool) preg_match('#^/(?:posts/[^/]+|feed/update/urn:li:(?:activity|share):[0-9]+)/?$#i', $path),
            default => false,
        };
    }
}

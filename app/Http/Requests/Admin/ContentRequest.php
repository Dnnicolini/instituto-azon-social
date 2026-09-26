<?php

namespace App\Http\Requests\Admin;

use App\Enums\ContentStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\UploadedFile;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

abstract class ContentRequest extends FormRequest
{
    /** @return class-string */
    abstract protected function modelClass(): string;

    public function authorize(): bool
    {
        $model = $this->route($this->routeParameter());

        return $model
            ? $this->user()?->can('update', $model) === true
            : $this->user()?->can('create', $this->modelClass()) === true;
    }

    /** @return array<int, mixed> */
    protected function statusRules(): array
    {
        return ['required', Rule::enum(ContentStatus::class)];
    }

    /** @return array<int, mixed> */
    protected function coverRules(): array
    {
        return [
            'nullable',
            'file',
            'mimes:jpg,jpeg,png,webp,gif,avif,bmp',
            'mimetypes:image/jpeg,image/png,image/webp,image/gif,image/avif,image/bmp,image/x-ms-bmp',
            'max:20480',
        ];
    }

    /** @return array<int, mixed> */
    protected function galleryMediaRules(): array
    {
        return [
            'file',
            'mimes:jpg,jpeg,png,webp,gif,avif,bmp,mp4,mov,m4v,webm,mkv,avi',
            'mimetypes:image/jpeg,image/png,image/webp,image/gif,image/avif,image/bmp,image/x-ms-bmp,video/mp4,video/quicktime,video/x-m4v,video/webm,video/x-matroska,video/x-msvideo',
            'max:204800',
            function (string $attribute, mixed $value, \Closure $fail): void {
                if ($value instanceof UploadedFile
                    && str_starts_with((string) $value->getMimeType(), 'image/')
                    && $value->getSize() > 20 * 1024 * 1024) {
                    $fail('Cada imagem pode ter no máximo 20 MB.');
                }
            },
        ];
    }

    /** @return array<int, callable> */
    public function after(): array
    {
        return [function (Validator $validator): void {
            if (in_array($this->input('status'), [ContentStatus::Published->value, ContentStatus::Scheduled->value], true)
                && ! $this->user()?->hasPermission('content.publish')) {
                $validator->errors()->add('status', 'Você não tem permissão para publicar ou agendar conteúdo.');
            }

            if ($this->input('status') === ContentStatus::Scheduled->value && ! $this->filled('published_at')) {
                $validator->errors()->add('published_at', 'Informe a data de publicação para conteúdo agendado.');
            }
        }];
    }

    protected function routeParameter(): string
    {
        return strtolower(class_basename($this->modelClass()));
    }

    protected function getRedirectUrl(): string
    {
        $routeName = (string) $this->route()?->getName();
        $model = $this->route($this->routeParameter());
        $query = array_filter([
            'section' => $this->query('section'),
            'type' => $this->query('type'),
        ], fn ($value): bool => is_string($value) && $value !== '');

        if ($model && str_ends_with($routeName, '.update')) {
            return route(str_replace('.update', '.edit', $routeName), [
                $this->routeParameter() => $model,
                ...$query,
            ]);
        }

        if (str_ends_with($routeName, '.store')) {
            return route(str_replace('.store', '.create', $routeName), $query);
        }

        return route('admin.dashboard');
    }
}

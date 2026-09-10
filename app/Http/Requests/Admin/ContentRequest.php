<?php

namespace App\Http\Requests\Admin;

use App\Enums\ContentStatus;
use Illuminate\Foundation\Http\FormRequest;
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
}

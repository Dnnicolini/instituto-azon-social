<?php

namespace App\Http\Requests\Admin;

use App\Enums\ProjectApplicationStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ProjectApplicationStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('update', $this->route('application')) === true;
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return ['status' => ['required', Rule::enum(ProjectApplicationStatus::class)], 'note' => ['nullable', 'string', 'max:10000']];
    }
}

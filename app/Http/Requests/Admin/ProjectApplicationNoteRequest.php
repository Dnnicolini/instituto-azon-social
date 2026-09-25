<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class ProjectApplicationNoteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('update', $this->route('application')) === true;
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return ['note' => ['required', 'string', 'max:10000']];
    }
}

<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UserStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('updateStatus', $this->route('user')) === true;
    }

    /** @return array<string, array<int, string>> */
    public function rules(): array
    {
        return ['active' => ['required', 'boolean']];
    }

    protected function getRedirectUrl(): string
    {
        return route('admin.users.index');
    }
}

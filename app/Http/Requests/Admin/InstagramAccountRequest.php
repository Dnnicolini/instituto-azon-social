<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class InstagramAccountRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasPermission('instagram.manage') === true;
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        $integration = $this->route('integration');

        return [
            'display_name' => ['required', 'string', 'max:120'],
            'expected_username' => ['required', 'string', 'max:60', 'regex:/^[A-Za-z0-9._]+$/', Rule::unique('social_integrations', 'expected_username')->where('provider', 'instagram')->ignore($integration)],
            'description' => ['nullable', 'string', 'max:500'],
            'group_key' => ['nullable', 'alpha_dash:ascii', 'max:80'],
            'sort_order' => ['nullable', 'integer', 'min:0', 'max:9999'],
            'enabled' => ['sometimes', 'boolean'],
            'auto_publish' => ['sometimes', 'boolean'],
            'public_enabled' => ['sometimes', 'boolean'],
            'display_locations' => ['nullable', 'array', 'max:20'],
            'display_locations.*' => ['string', 'max:80', 'distinct'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge(['expected_username' => strtolower(ltrim(trim((string) $this->input('expected_username')), '@'))]);
    }
}

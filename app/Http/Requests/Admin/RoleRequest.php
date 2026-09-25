<?php

namespace App\Http\Requests\Admin;

use App\Models\Permission;
use App\Models\Role;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class RoleRequest extends FormRequest
{
    public function authorize(): bool
    {
        $role = $this->route('role');

        return $role ? $this->user()?->can('update', $role) === true : $this->user()?->can('create', Role::class) === true;
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:100'],
            'slug' => ['required', 'alpha_dash:ascii', 'max:100', Rule::unique('roles')->ignore($this->route('role'))],
            'description' => ['nullable', 'string', 'max:1000'],
            'permissions' => ['required', 'array', 'min:1'],
            'permissions.*' => ['integer', Rule::exists('permissions', 'id')],
        ];
    }

    /** @return array<int, callable> */
    public function after(): array
    {
        return [function (Validator $validator): void {
            $input = $this->input('permissions');
            if (! is_array($input)) {
                return;
            }

            $permissionIds = array_values(array_filter(
                $input,
                fn (mixed $id): bool => is_int($id) || (is_string($id) && ctype_digit($id)),
            ));

            if ($permissionIds === []) {
                return;
            }

            $slugs = Permission::query()->whereKey($permissionIds)->pluck('slug');
            $panelPermissions = $slugs->diff(['access-admin']);
            if ($panelPermissions->isNotEmpty() && ! $slugs->contains('access-admin')) {
                $validator->errors()->add('permissions', 'Inclua a permissão "Acessar painel" para usar permissões administrativas.');
            }
        }];
    }

    protected function getRedirectUrl(): string
    {
        $role = $this->route('role');

        return $role
            ? route('admin.roles.edit', $role)
            : route('admin.roles.create');
    }
}

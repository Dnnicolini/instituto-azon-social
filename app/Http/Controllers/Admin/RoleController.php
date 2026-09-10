<?php

namespace App\Http\Controllers\Admin;

use App\Http\Requests\Admin\RoleRequest;
use App\Models\Permission;
use App\Models\Role;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class RoleController extends AdminController
{
    public function index(): Response
    {
        $this->authorize('viewAny', Role::class);
        $roles = Role::query()->with('permissions:id,name,slug,group')->withCount('users')->orderBy('name')->get()->map(fn (Role $role): array => $this->serialize($role));
        $permissions = Permission::query()
            ->whereNotIn('slug', ['messages.view', 'messages.manage'])
            ->orderBy('group')
            ->orderBy('name');
        if (! request()->user()?->hasRole('administrator')) {
            $permissionSlugs = request()->user()?->loadMissing('roles.permissions')->roles
                ->flatMap->permissions
                ->pluck('slug') ?? collect();
            $permissions->whereIn('slug', $permissionSlugs);
        }

        return Inertia::render('admin/roles', [
            'groups' => $roles,
            'permissions' => $permissions->get(['id', 'name', 'slug', 'group']),
        ]);
    }

    public function store(RoleRequest $request): RedirectResponse
    {
        $this->authorizePermissionAssignment($request);
        $role = DB::transaction(function () use ($request): Role {
            $role = Role::query()->create([...Arr::except($request->validated(), 'permissions'), 'is_system' => false]);
            $role->permissions()->sync($request->validated('permissions'));
            $this->recordChange('role.created', $role);

            return $role;
        });

        return back()->with('success', "Grupo {$role->name} criado.");
    }

    public function update(RoleRequest $request, Role $role): RedirectResponse
    {
        $this->authorizePermissionAssignment($request);
        DB::transaction(function () use ($request, $role): void {
            $before = $role->load('permissions')->toArray();
            $role->update(Arr::except($request->validated(), 'permissions'));
            $role->permissions()->sync($request->validated('permissions'));
            $this->recordChange('role.updated', $role, $before);
        });

        return back()->with('success', 'Grupo atualizado.');
    }

    public function destroy(Role $role): RedirectResponse
    {
        $this->authorize('delete', $role);
        $this->recordChange('role.deleted', $role);
        $role->delete();

        return back()->with('success', 'Grupo excluído.');
    }

    /** @return array<string, mixed> */
    private function serialize(Role $role): array
    {
        return ['id' => $role->id, 'name' => $role->name, 'slug' => $role->slug, 'description' => $role->description, 'is_system' => $role->is_system, 'permissions' => $role->permissions->map(fn (Permission $permission): array => ['id' => $permission->id, 'name' => $permission->name, 'slug' => $permission->slug, 'group' => $permission->group])->values(), 'users_count' => $role->users_count];
    }

    private function authorizePermissionAssignment(RoleRequest $request): void
    {
        $actor = $request->user();
        $requestedPermissions = Permission::query()
            ->whereKey($request->validated('permissions'))
            ->pluck('slug');

        abort_if(
            $requestedPermissions->intersect(['messages.view', 'messages.manage'])->isNotEmpty(),
            403,
            'O CRM é exclusivo do grupo administrador.',
        );

        if ($actor?->hasRole('administrator')) {
            return;
        }

        $actorPermissions = $actor?->loadMissing('roles.permissions')->roles
            ->flatMap->permissions
            ->pluck('slug')
            ->unique() ?? collect();

        abort_if(
            $requestedPermissions->diff($actorPermissions)->isNotEmpty(),
            403,
            'Você não pode conceder permissões que não possui.',
        );
    }
}

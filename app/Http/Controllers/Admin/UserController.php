<?php

namespace App\Http\Controllers\Admin;

use App\Http\Requests\Admin\StoreUserRequest;
use App\Http\Requests\Admin\UserRequest;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends AdminController
{
    public function index(): Response
    {
        $this->authorize('viewAny', User::class);
        $users = User::query()->with('roles:id,name,slug')->latest()->paginate(20)->withQueryString()->through(fn (User $user): array => $this->serialize($user));
        $roles = Role::query()->orderBy('name');
        if (! request()->user()?->hasRole('administrator')) {
            $roles->where('slug', '!=', 'administrator');
        }

        return Inertia::render('admin/users', [
            'users' => $users,
            'roles' => $roles->get(['id', 'name', 'slug']),
        ]);
    }

    public function store(StoreUserRequest $request): RedirectResponse
    {
        $newRoles = $request->validated('roles');
        $this->authorizeRoleAssignment($request, $newRoles);

        $user = DB::transaction(function () use ($request, $newRoles): User {
            $user = User::query()->create([
                'name' => $request->string('name')->toString(),
                'email' => $request->string('email')->lower()->toString(),
                'password' => Str::password(64),
                'email_verified_at' => null,
            ]);
            $user->roles()->sync($newRoles);
            $this->recordChange('user.created', $user);

            return $user;
        });

        Password::sendResetLink(['email' => $user->email]);
        $user->sendEmailVerificationNotification();

        return back()->with('success', 'Usuário criado. Um link para definir a senha foi enviado.');
    }

    public function update(UserRequest $request, User $user): RedirectResponse
    {
        $administratorRoleId = Role::query()->where('slug', 'administrator')->value('id');
        $newRoles = $request->validated('roles');
        abort_if($user->hasRole('administrator') && ! $request->user()->hasRole('administrator'), 403);
        $this->authorizeRoleAssignment($request, $newRoles);
        abort_if($request->user()->is($user) && ! in_array($administratorRoleId, $newRoles, true), 422, 'Você não pode remover seu próprio acesso de administrador.');

        DB::transaction(function () use ($request, $user, $newRoles): void {
            $administratorRoleId = Role::query()
                ->where('slug', 'administrator')
                ->lockForUpdate()
                ->value('id');

            if ($user->hasRole('administrator') && ! in_array($administratorRoleId, $newRoles, true)) {
                $adminCount = User::query()->whereHas('roles', fn ($query) => $query->where('slug', 'administrator'))->count();
                abort_if($adminCount <= 1, 422, 'O último administrador não pode perder esse grupo.');
            }

            $before = $user->load('roles')->toArray();
            $email = $request->string('email')->lower()->toString();
            $emailChanged = $email !== $user->email;
            $user->fill(['name' => $request->string('name')->toString(), 'email' => $email]);
            if ($emailChanged) {
                $user->forceFill(['email_verified_at' => null]);
            }
            $user->save();
            $user->roles()->sync($newRoles);
            $this->recordChange('user.updated', $user, $before);
        });

        if ($user->wasChanged('email')) {
            $user->sendEmailVerificationNotification();
        }

        return back()->with('success', 'Usuário atualizado.');
    }

    public function destroy(User $user): RedirectResponse
    {
        $this->authorize('delete', $user);
        abort_if($user->hasRole('administrator') && ! request()->user()?->hasRole('administrator'), 403);
        DB::transaction(function () use ($user): void {
            Role::query()->where('slug', 'administrator')->lockForUpdate()->firstOrFail();
            if ($user->hasRole('administrator')) {
                $adminCount = User::query()->whereHas('roles', fn ($query) => $query->where('slug', 'administrator'))->count();
                abort_if($adminCount <= 1, 422, 'O último administrador não pode ser excluído.');
            }

            $this->recordChange('user.deleted', $user);
            $user->delete();
        });

        return back()->with('success', 'Usuário excluído.');
    }

    /** @return array<string, mixed> */
    private function serialize(User $user): array
    {
        return ['id' => $user->id, 'name' => $user->name, 'email' => $user->email, 'email_verified_at' => $user->email_verified_at?->toIso8601String(), 'created_at' => $user->created_at?->toIso8601String(), 'roles' => $user->roles->map(fn (Role $role): array => ['id' => $role->id, 'name' => $role->name, 'slug' => $role->slug])->values()];
    }

    /** @param array<int, int> $roleIds */
    private function authorizeRoleAssignment(Request $request, array $roleIds): void
    {
        $actor = $request->user();
        if ($actor?->hasRole('administrator')) {
            return;
        }

        $actorPermissions = $actor?->loadMissing('roles.permissions')->roles
            ->flatMap->permissions
            ->pluck('slug')
            ->unique() ?? collect();
        $requestedRoles = Role::query()->with('permissions:id,slug')->whereKey($roleIds)->get();
        $grantsAdministrator = $requestedRoles->contains('slug', 'administrator');
        $grantsExtraPermission = $requestedRoles->flatMap->permissions
            ->pluck('slug')
            ->diff($actorPermissions)
            ->isNotEmpty();

        abort_if(
            $grantsAdministrator || $grantsExtraPermission,
            403,
            'Você não pode conceder um nível de acesso superior ao seu.',
        );
    }
}

<?php

namespace App\Http\Controllers\Admin;

use App\Http\Requests\Admin\StoreUserRequest;
use App\Http\Requests\Admin\UserRequest;
use App\Http\Requests\Admin\UserStatusRequest;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class UserController extends AdminController
{
    public function index(): Response
    {
        $this->authorize('viewAny', User::class);
        $actor = request()->user()->loadMissing('roles.permissions');
        $search = mb_substr(trim((string) request()->query('q', '')), 0, 100);
        $users = User::query()
            ->with('roles:id,name,slug')
            ->when($search !== '', fn ($query) => $query->where(function ($query) use ($search): void {
                $query->whereLike('name', "%{$search}%", caseSensitive: false)
                    ->orWhereLike('email', "%{$search}%", caseSensitive: false)
                    ->orWhereHas('roles', fn ($query) => $query->whereLike('name', "%{$search}%", caseSensitive: false));
            }))
            ->latest()
            ->paginate(20)
            ->withQueryString()
            ->through(fn (User $user): array => $this->serialize($user, $actor));
        $roles = Role::query()->orderBy('name');
        if (! request()->user()?->hasRole('administrator')) {
            $roles->where('slug', '!=', 'administrator');
        }

        return Inertia::render('admin/users', [
            'users' => $users,
            'roles' => $roles->get(['id', 'name', 'slug']),
            'filters' => ['q' => $search],
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

        try {
            $status = Password::sendResetLink(['email' => $user->email]);
        } catch (Throwable $exception) {
            report($exception);

            return redirect()->route('admin.users.index')->with('error', 'Usuário criado, mas o convite não pôde ser enviado. Tente reenviar a redefinição de senha.');
        }

        if ($status !== Password::RESET_LINK_SENT) {
            return redirect()->route('admin.users.index')->with('error', 'Usuário criado, mas o convite não pôde ser enviado agora. Tente reenviar a redefinição de senha.');
        }

        return redirect()->route('admin.users.index')->with('success', 'Usuário criado. Um link para definir a senha foi enviado.');
    }

    public function update(UserRequest $request, User $user): RedirectResponse
    {
        $newRoles = $request->validated('roles');
        abort_if($user->hasRole('administrator') && ! $request->user()->hasRole('administrator'), 403);
        $this->authorizeRoleAssignment($request, $newRoles);

        $emailChanged = DB::transaction(function () use ($request, $user, $newRoles): bool {
            $administratorRoleId = Role::query()
                ->where('slug', 'administrator')
                ->lockForUpdate()
                ->value('id');
            User::query()->whereKey($user->getKey())->lockForUpdate()->firstOrFail();
            $user->refresh()->load('roles');
            $request->user()?->unsetRelation('roles');

            abort_unless($request->user()?->can('update', $user), 403);
            $this->authorizeRoleAssignment($request, $newRoles);
            if ($request->user()?->is($user) && ! in_array($administratorRoleId, $newRoles, true)) {
                $this->failUserValidation('roles', 'Você não pode remover seu próprio acesso de administrador.');
            }

            $email = $request->string('email')->lower()->toString();
            $emailChanged = $email !== $user->email;

            if ($user->disabled_at === null && $user->hasVerifiedEmail() && $user->hasRole('administrator') && ! in_array($administratorRoleId, $newRoles, true)) {
                $adminCount = User::query()->whereNull('disabled_at')->whereNotNull('email_verified_at')->whereHas('roles', fn ($query) => $query->where('slug', 'administrator'))->count();
                if ($adminCount <= 1) {
                    $this->failUserValidation('roles', 'O último administrador não pode perder esse grupo.');
                }
            }

            if ($emailChanged && $user->disabled_at === null && $user->hasVerifiedEmail() && $user->hasRole('administrator')) {
                $adminCount = User::query()->whereNull('disabled_at')->whereNotNull('email_verified_at')->whereHas('roles', fn ($query) => $query->where('slug', 'administrator'))->count();
                if ($adminCount <= 1) {
                    $this->failUserValidation('email', 'O e-mail do último administrador ativo não pode ser alterado.');
                }
            }

            $before = $user->load('roles')->toArray();
            $user->fill(['name' => $request->string('name')->toString(), 'email' => $email]);
            if ($emailChanged) {
                $user->forceFill(['email_verified_at' => null]);
            }
            $user->save();
            $user->roles()->sync($newRoles);
            $this->recordChange('user.updated', $user, $before);

            return $emailChanged;
        });

        if ($emailChanged) {
            try {
                $user->sendEmailVerificationNotification();
            } catch (Throwable $exception) {
                report($exception);

                return redirect()->route('admin.users.index')->with('error', 'Usuário atualizado, mas a verificação do novo e-mail não pôde ser enviada. Tente enviar uma redefinição de senha.');
            }
        }

        return redirect()->route('admin.users.index')->with('success', 'Usuário atualizado.');
    }

    public function updateStatus(UserStatusRequest $request, User $user): RedirectResponse
    {
        $active = $request->boolean('active');

        DB::transaction(function () use ($active, $request, $user): void {
            Role::query()->where('slug', 'administrator')->lockForUpdate()->firstOrFail();
            User::query()->whereKey($user->getKey())->lockForUpdate()->firstOrFail();
            $user->refresh()->load('roles');
            $request->user()?->unsetRelation('roles');

            abort_unless($request->user()?->can('updateStatus', $user), 403);

            if (! $active && $user->disabled_at === null && $user->hasVerifiedEmail() && $user->hasRole('administrator')) {
                $activeAdministrators = User::query()
                    ->whereNull('disabled_at')
                    ->whereNotNull('email_verified_at')
                    ->whereHas('roles', fn ($query) => $query->where('slug', 'administrator'))
                    ->count();
                abort_if($activeAdministrators <= 1, 422, 'O último administrador ativo não pode ser desativado.');
            }

            $user->forceFill([
                'disabled_at' => $active ? null : now(),
                ...($active ? [] : ['remember_token' => Str::random(60)]),
            ])->save();

            if (! $active && config('session.driver') === 'database') {
                DB::table((string) config('session.table', 'sessions'))
                    ->where('user_id', $user->id)
                    ->delete();
            }
            if (! $active) {
                Password::deleteToken($user);
            }

            $this->recordChange($active ? 'user.activated' : 'user.disabled', $user);
        });

        return redirect()->route('admin.users.index')->with('success', $active ? 'Usuário ativado.' : 'Usuário desativado e sessões encerradas.');
    }

    public function sendPasswordReset(User $user): RedirectResponse
    {
        $this->authorize('sendPasswordReset', $user);

        try {
            $status = Password::sendResetLink(['email' => $user->email]);
        } catch (Throwable $exception) {
            report($exception);

            return redirect()->route('admin.users.index')->with('error', 'Não foi possível enviar o link de redefinição de senha. Tente novamente.');
        }

        if ($status !== Password::RESET_LINK_SENT) {
            return redirect()->route('admin.users.index')->with('error', 'Não foi possível enviar o link de redefinição de senha agora. Tente novamente.');
        }

        $this->recordChange('user.password_reset_requested', $user);

        return redirect()->route('admin.users.index')->with('success', 'Link de redefinição de senha enviado.');
    }

    public function destroy(Request $request, User $user): RedirectResponse
    {
        $this->authorize('delete', $user);
        abort_if($user->hasRole('administrator') && ! request()->user()?->hasRole('administrator'), 403);
        DB::transaction(function () use ($request, $user): void {
            Role::query()->where('slug', 'administrator')->lockForUpdate()->firstOrFail();
            User::query()->whereKey($user->getKey())->lockForUpdate()->firstOrFail();
            $user->refresh()->load('roles');
            $request->user()?->unsetRelation('roles');

            abort_unless($request->user()?->can('delete', $user), 403);
            if ($user->disabled_at === null && $user->hasVerifiedEmail() && $user->hasRole('administrator')) {
                $adminCount = User::query()->whereNull('disabled_at')->whereNotNull('email_verified_at')->whereHas('roles', fn ($query) => $query->where('slug', 'administrator'))->count();
                abort_if($adminCount <= 1, 422, 'O último administrador não pode ser excluído.');
            }

            $this->recordChange('user.deleted', $user);
            $user->delete();
        });

        return redirect()->route('admin.users.index')->with('success', 'Usuário excluído.');
    }

    /** @return array<string, mixed> */
    private function serialize(User $user, User $actor): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'email_verified_at' => $user->email_verified_at?->toIso8601String(),
            'disabled_at' => $user->disabled_at?->toIso8601String(),
            'status' => $user->disabled_at !== null ? 'disabled' : ($user->hasVerifiedEmail() ? 'active' : 'pending'),
            'created_at' => $user->created_at?->toIso8601String(),
            'roles' => $user->roles->map(fn (Role $role): array => ['id' => $role->id, 'name' => $role->name, 'slug' => $role->slug])->values(),
            'capabilities' => [
                'update' => $actor->can('update', $user),
                'delete' => $actor->can('delete', $user),
                'toggle_status' => $actor->can('updateStatus', $user),
                'reset_password' => $actor->can('sendPasswordReset', $user),
            ],
        ];
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

    private function failUserValidation(string $field, string $message): never
    {
        throw ValidationException::withMessages([$field => $message])
            ->redirectTo(route('admin.users.index'));
    }
}

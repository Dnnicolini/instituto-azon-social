<?php

use App\Models\AuditLog;
use App\Models\Permission;
use App\Models\Project;
use App\Models\Role;
use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Contracts\Notifications\Dispatcher as NotificationDispatcher;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;

beforeEach(function (): void {
    $this->withoutVite();
    config(['inertia.ssr.enabled' => false]);
});

it('redirects invalid admin forms deterministically without a referer', function (): void {
    $admin = $this->cmsUser();
    $project = Project::query()->create([
        'title' => 'Projeto',
        'slug' => 'projeto',
        'badge_label' => 'Educação',
        'status' => 'draft',
        'sort_order' => 1,
    ]);

    $this->actingAs($admin)->post(route('admin.projects.store'), [])
        ->assertRedirect(route('admin.projects.create'));
    $this->actingAs($admin)->put(route('admin.projects.update', $project), [])
        ->assertRedirect(route('admin.projects.edit', $project));
    $this->actingAs($admin)->post(route('admin.users.store'), [])
        ->assertRedirect(route('admin.users.create'));
    $this->actingAs($admin)->post(route('admin.roles.store'), [])
        ->assertRedirect(route('admin.roles.create'));
    $this->actingAs($admin)->put(route('admin.settings.update'), [])
        ->assertRedirect(route('admin.settings.edit'));
    $this->actingAs($admin)->post(route('admin.posts.store', ['section' => 'social']), [])
        ->assertRedirect(route('admin.posts.create', ['section' => 'social']));

    $this->actingAs($admin)->put(route('admin.projects.update', $project), [
        'title' => 'Projeto atualizado',
        'slug' => $project->slug,
        'badge_label' => 'Educação',
        'status' => 'draft',
        'sort_order' => 1,
    ])->assertRedirect(route('admin.projects.edit', $project));
});

it('serves user forms on separate authorized pages', function (): void {
    $admin = $this->cmsUser();
    $target = $this->cmsUser('editor');

    $this->actingAs($admin)->get(route('admin.users.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/users')
            ->missing('roles'));

    $this->actingAs($admin)->get(route('admin.users.create'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/users/create')
            ->has('roles'));

    $this->actingAs($admin)->get(route('admin.users.edit', $target))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/users/edit')
            ->where('managedUser.id', $target->id)
            ->has('roles'));

    $publisher = $this->cmsUser('publisher');
    $this->actingAs($publisher)->get(route('admin.users.create'))->assertForbidden();
});

it('serves only editable groups on separate form pages', function (): void {
    $admin = $this->cmsUser();
    $customRole = Role::query()->create([
        'name' => 'Comunicação',
        'slug' => 'comunicacao',
        'is_system' => false,
    ]);
    $systemRole = Role::query()->where('slug', 'editor')->firstOrFail();

    $this->actingAs($admin)->get(route('admin.roles.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/roles')
            ->missing('permissions'));

    $this->actingAs($admin)->get(route('admin.roles.create'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/roles/create')
            ->has('permissions'));

    $this->actingAs($admin)->get(route('admin.roles.edit', $customRole))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/roles/edit')
            ->where('group.id', $customRole->id)
            ->has('permissions'));

    $this->actingAs($admin)->get(route('admin.roles.edit', $systemRole))->assertForbidden();

    $publisher = $this->cmsUser('publisher');
    $this->actingAs($publisher)->get(route('admin.roles.create'))->assertForbidden();
});

it('returns invalid access forms to their own pages', function (): void {
    $admin = $this->cmsUser();
    $target = $this->cmsUser('editor');
    $role = Role::query()->create([
        'name' => 'Comunicação',
        'slug' => 'comunicacao',
        'is_system' => false,
    ]);

    $this->actingAs($admin)->put(route('admin.users.update', $target), [])
        ->assertRedirect(route('admin.users.edit', $target));
    $this->actingAs($admin)->put(route('admin.roles.update', $role), [])
        ->assertRedirect(route('admin.roles.edit', $role));
});

it('requires panel access explicitly when a group receives another permission', function (): void {
    $admin = $this->cmsUser();
    $permission = Permission::query()->where('slug', 'users.manage')->firstOrFail();

    $this->actingAs($admin)->post(route('admin.roles.store'), [
        'name' => 'Gestor sem painel',
        'slug' => 'gestor-sem-painel',
        'permissions' => [$permission->id],
    ])->assertSessionHasErrors('permissions');

    $this->assertDatabaseMissing('roles', ['slug' => 'gestor-sem-painel']);
});

it('creates the user even when invitation transport fails and reports the failure', function (): void {
    $admin = $this->cmsUser();
    $editor = Role::query()->where('slug', 'editor')->firstOrFail();
    Password::shouldReceive('sendResetLink')->once()->andThrow(new RuntimeException('transport unavailable'));

    $this->actingAs($admin)->post(route('admin.users.store'), [
        'name' => 'Usuária convidada',
        'email' => 'convite@example.org',
        'roles' => [$editor->id],
    ])->assertRedirect(route('admin.users.index'))->assertSessionHas('error');

    $this->assertDatabaseHas('users', ['email' => 'convite@example.org']);
});

it('keeps an updated email and reports when its verification cannot be sent', function (): void {
    $admin = $this->cmsUser();
    $target = $this->cmsUser();
    $administrator = Role::query()->where('slug', 'administrator')->firstOrFail();
    $this->mock(NotificationDispatcher::class, function ($mock): void {
        $mock->shouldReceive('send')->once()->andThrow(new RuntimeException('transport unavailable'));
    });

    $this->actingAs($admin)->put(route('admin.users.update', $target), [
        'name' => $target->name,
        'email' => 'novo-email@example.org',
        'roles' => [$administrator->id],
    ])->assertRedirect(route('admin.users.index'))->assertSessionHas('error');

    expect($target->fresh()->email)->toBe('novo-email@example.org')
        ->and($target->fresh()->email_verified_at)->toBeNull();
});

it('keeps a newly created user when the password broker rejects the invitation', function (): void {
    $admin = $this->cmsUser();
    $editor = Role::query()->where('slug', 'editor')->firstOrFail();
    Password::shouldReceive('sendResetLink')->once()->andReturn(Password::RESET_THROTTLED);

    $this->actingAs($admin)->post(route('admin.users.store'), [
        'name' => 'Usuário aguardando convite',
        'email' => 'aguardando@example.org',
        'roles' => [$editor->id],
    ])->assertRedirect(route('admin.users.index'))->assertSessionHas('error');

    $this->assertDatabaseHas('users', ['email' => 'aguardando@example.org']);
});

it('sends only a password reset notification when inviting a user', function (): void {
    Notification::fake();
    $admin = $this->cmsUser();
    $editor = Role::query()->where('slug', 'editor')->firstOrFail();

    $this->actingAs($admin)->post(route('admin.users.store'), [
        'name' => 'Usuária convidada',
        'email' => 'convite@example.org',
        'roles' => [$editor->id],
    ])->assertRedirect(route('admin.users.index'))->assertSessionHas('success');

    $invited = User::query()->where('email', 'convite@example.org')->firstOrFail();
    Notification::assertSentTo($invited, ResetPassword::class);
    Notification::assertNotSentTo($invited, VerifyEmail::class);
});

it('serializes user status and capabilities for the authenticated manager', function (): void {
    $admin = $this->cmsUser();
    $pending = User::factory()->unverified()->create();
    $pending->roles()->attach(Role::query()->where('slug', 'editor')->firstOrFail());

    $this->actingAs($admin)->get(route('admin.users.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->where('users.data', function ($users) use ($pending): bool {
            $serialized = collect($users)->firstWhere('id', $pending->id);

            return $serialized['status'] === 'pending'
                && $serialized['disabled_at'] === null
                && $serialized['capabilities'] === [
                    'update' => true,
                    'delete' => true,
                    'toggle_status' => true,
                    'reset_password' => true,
                ];
        }));
});

it('searches the complete user directory without case sensitivity', function (): void {
    $admin = $this->cmsUser();
    $target = User::factory()->create([
        'name' => 'Daniele Nicolini',
        'email' => 'daniele@azonsocial.org.br',
    ]);
    User::factory()->count(21)->create();

    $this->actingAs($admin)->get(route('admin.users.index', ['q' => 'nIcOlInI']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('filters.q', 'nIcOlInI')
            ->where('users.total', 1)
            ->where('users.data.0.id', $target->id));
});

it('supports a validated server-side page size for the user directory', function (): void {
    $admin = $this->cmsUser();
    User::factory()->count(24)->create();

    $this->actingAs($admin)->get(route('admin.users.index', ['per_page' => 10]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('filters.per_page', 10)
            ->where('users.per_page', 10)
            ->has('users.data', 10));

    $this->actingAs($admin)->get(route('admin.users.index', ['per_page' => 999]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('filters.per_page', 20)
            ->where('users.per_page', 20));
});

it('filters the complete user directory by account status', function (): void {
    $admin = $this->cmsUser();
    $active = $this->cmsUser('editor');
    $pending = User::factory()->unverified()->create();
    $disabled = $this->cmsUser('editor');
    $disabled->forceFill(['disabled_at' => now()])->save();

    $this->actingAs($admin)->get(route('admin.users.index', ['status' => 'pending']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('filters.status', 'pending')
            ->where('users.total', 1)
            ->where('users.data.0.id', $pending->id));

    $this->actingAs($admin)->get(route('admin.users.index', ['status' => 'disabled']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('filters.status', 'disabled')
            ->where('users.total', 1)
            ->where('users.data.0.id', $disabled->id));

    $this->actingAs($admin)->get(route('admin.users.index', [
        'q' => $active->email,
        'status' => 'active',
    ]))->assertOk()->assertInertia(fn ($page) => $page
        ->where('filters.q', $active->email)
        ->where('filters.status', 'active')
        ->where('users.total', 1)
        ->where('users.data.0.id', $active->id));
});

it('disables and activates a user while invalidating remembered access and auditing the change', function (): void {
    config(['session.driver' => 'database']);
    $admin = $this->cmsUser();
    $user = $this->cmsUser('editor');
    $rememberToken = $user->remember_token;
    $passwordResetToken = Password::broker()->createToken($user);
    DB::table('sessions')->insert([
        'id' => 'target-session',
        'user_id' => $user->id,
        'ip_address' => '127.0.0.1',
        'user_agent' => 'Pest',
        'payload' => '',
        'last_activity' => now()->timestamp,
    ]);

    $this->actingAs($admin)->patch(route('admin.users.status', $user), ['active' => false])
        ->assertRedirect(route('admin.users.index'));

    $user->refresh();
    expect($user->disabled_at)->not->toBeNull()
        ->and($user->remember_token)->not->toBe($rememberToken);
    $this->assertDatabaseMissing('sessions', ['id' => 'target-session']);
    expect(Password::broker()->tokenExists($user, $passwordResetToken))->toBeFalse();
    $this->assertDatabaseHas('audit_logs', ['action' => 'user.disabled', 'auditable_id' => $user->id]);

    $this->actingAs($admin)->patch(route('admin.users.status', $user), ['active' => true])
        ->assertRedirect(route('admin.users.index'));
    expect($user->fresh()->disabled_at)->toBeNull();
    $this->assertDatabaseHas('audit_logs', ['action' => 'user.activated', 'auditable_id' => $user->id]);
});

it('rejects disabled credentials and closes a session disabled after login', function (): void {
    $user = $this->cmsUser();
    $user->forceFill(['disabled_at' => now()])->save();

    $this->post(route('admin.login.store'), ['email' => $user->email, 'password' => 'password'])
        ->assertSessionHasErrors(['email' => 'As credenciais informadas não são válidas.']);
    $this->assertGuest();

    $user->forceFill(['disabled_at' => null])->save();
    $this->actingAs($user);
    $user->forceFill(['disabled_at' => now()])->save();
    $this->get(route('admin.dashboard'))
        ->assertRedirect(route('admin.login'))
        ->assertSessionHas('error');
    $this->assertGuest();
});

it('prevents self disable and protects the last active administrator', function (): void {
    $admin = $this->cmsUser();
    $pendingAdmin = $this->cmsUser();
    $pendingAdmin->forceFill(['email_verified_at' => null])->save();

    $this->actingAs($admin)->patch(route('admin.users.status', $admin), ['active' => false])
        ->assertForbidden();

    $this->actingAs($admin)->put(route('admin.users.update', $admin), [
        'name' => $admin->name,
        'email' => $admin->email,
        'roles' => [Role::query()->where('slug', 'editor')->value('id')],
    ])->assertRedirect(route('admin.users.edit', $admin))->assertSessionHasErrors('roles');

    $this->actingAs($admin)->put(route('admin.users.update', $admin), [
        'name' => $admin->name,
        'email' => 'novo-admin@example.org',
        'roles' => [Role::query()->where('slug', 'administrator')->value('id')],
    ])->assertRedirect(route('admin.users.edit', $admin))->assertSessionHasErrors('email');
    expect($admin->fresh()->email)->not->toBe('novo-admin@example.org');

    $otherAdmin = $this->cmsUser();
    $this->actingAs($admin)->patch(route('admin.users.status', $otherAdmin), ['active' => false])
        ->assertRedirect(route('admin.users.index'));
    $this->actingAs($admin)->patch(route('admin.users.status', $admin), ['active' => false])
        ->assertForbidden();

    expect($admin->fresh()->disabled_at)->toBeNull();
});

it('does not let a delegated user manager act on administrators', function (): void {
    $administrator = $this->cmsUser();
    $managerRole = Role::query()->create(['name' => 'Gestor', 'slug' => 'gestor', 'is_system' => false]);
    $managerRole->permissions()->sync(Permission::query()->whereIn('slug', ['access-admin', 'users.manage'])->pluck('id'));
    $manager = User::factory()->create();
    $manager->roles()->attach($managerRole);

    $this->actingAs($manager)->get(route('admin.users.edit', $administrator))->assertForbidden();
    $this->actingAs($manager)->put(route('admin.users.update', $administrator), [
        'name' => $administrator->name,
        'email' => $administrator->email,
        'roles' => [$administrator->roles()->firstOrFail()->id],
    ])->assertForbidden();
    $this->actingAs($manager)->patch(route('admin.users.status', $administrator), ['active' => false])->assertForbidden();
    $this->actingAs($manager)->post(route('admin.users.password-reset', $administrator))->assertForbidden();
    $this->actingAs($manager)->delete(route('admin.users.destroy', $administrator))->assertForbidden();
});

it('sends an audited password reset without activating a disabled user', function (): void {
    Notification::fake();
    $admin = $this->cmsUser();
    $user = $this->cmsUser('editor');
    $user->forceFill(['disabled_at' => now()])->save();

    $this->actingAs($admin)->post(route('admin.users.password-reset', $user))
        ->assertRedirect(route('admin.users.index'))->assertSessionHas('success');

    Notification::assertSentTo($user, ResetPassword::class);
    expect($user->fresh()->disabled_at)->not->toBeNull();
    expect(AuditLog::query()->where('action', 'user.password_reset_requested')->where('auditable_id', $user->id)->exists())->toBeTrue();

    auth()->logout();
    $token = Password::broker()->createToken($user);
    $this->post(route('password.store'), [
        'email' => $user->email,
        'token' => $token,
        'password' => 'NovaSenha!123',
        'password_confirmation' => 'NovaSenha!123',
    ])->assertRedirect(route('admin.login'));

    expect(Hash::check('NovaSenha!123', $user->fresh()->password))->toBeTrue()
        ->and($user->fresh()->disabled_at)->not->toBeNull();
});

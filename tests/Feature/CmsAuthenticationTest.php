<?php

use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;

beforeEach(function (): void {
    $this->withoutVite();
    config(['inertia.ssr.enabled' => false]);
});

it('allows only a verified user with panel permission to authenticate', function (): void {
    $admin = $this->cmsUser();

    $this->post(route('admin.login.store'), ['email' => strtoupper($admin->email), 'password' => 'password'])
        ->assertRedirect(route('admin.dashboard'));
    $this->assertAuthenticatedAs($admin);

    auth()->logout();
    $outsider = User::factory()->create();
    $this->post(route('admin.login.store'), ['email' => $outsider->email, 'password' => 'password'])
        ->assertSessionHasErrors('email');
    $this->assertGuest();
});

it('rejects unverified panel users without exposing account state', function (): void {
    $user = $this->cmsUser();
    $user->forceFill(['email_verified_at' => null])->save();

    $this->post(route('admin.login.store'), ['email' => $user->email, 'password' => 'password'])
        ->assertSessionHasErrors(['email' => 'As credenciais informadas não são válidas.']);
    $this->assertGuest();
});

it('invalidates the session on logout', function (): void {
    $admin = $this->cmsUser();

    $this->actingAs($admin)->post(route('admin.logout'))->assertRedirect(route('admin.login'));
    $this->assertGuest();
});

it('sends a password reset link without public registration', function (): void {
    Notification::fake();
    $admin = $this->cmsUser();

    $this->post(route('admin.password.email'), ['email' => $admin->email])->assertSessionHas('status');
    Notification::assertSentTo($admin, ResetPassword::class);
    $this->get('/register')->assertNotFound();
});

it('resets the password and verifies possession of the email address', function (): void {
    $user = $this->cmsUser();
    $user->forceFill(['email_verified_at' => null])->save();
    $token = Password::broker()->createToken($user);

    $this->post(route('password.store'), ['email' => $user->email, 'token' => $token, 'password' => 'NovaSenha!123', 'password_confirmation' => 'NovaSenha!123'])->assertRedirect(route('admin.login'));

    expect(Hash::check('NovaSenha!123', $user->fresh()->password))->toBeTrue()
        ->and($user->fresh()->hasVerifiedEmail())->toBeTrue();
});

it('creates the first verified administrator idempotently without a versioned password', function (): void {
    $this->artisan('azon:create-admin', ['email' => 'admin@azon.example'])
        ->expectsQuestion('Nome', 'Admin Azon')
        ->expectsQuestion('Senha forte', 'SenhaMuitoForte!123')
        ->assertSuccessful();

    $this->artisan('azon:create-admin', ['email' => 'admin@azon.example'])->assertSuccessful();

    $admin = User::query()->where('email', 'admin@azon.example')->firstOrFail();
    expect($admin->hasVerifiedEmail())->toBeTrue()->and($admin->hasRole('administrator'))->toBeTrue();
    $this->assertDatabaseCount('users', 1);
});

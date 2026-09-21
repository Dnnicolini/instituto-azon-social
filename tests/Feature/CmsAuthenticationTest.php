<?php

use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Auth\Notifications\VerifyEmail;
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

it('prevents password reset URLs from being sent as referrers or cached', function (): void {
    $this->get(route('password.reset', ['token' => 'test-token']))
        ->assertOk()
        ->assertHeader('Referrer-Policy', 'no-referrer')
        ->assertHeader('Cache-Control', 'no-store, private');
});

it('blocks inline scripts in the admin and permits only the public accessibility script', function (): void {
    config(['app.env' => 'production']);

    $this->get(route('admin.login'))
        ->assertOk()
        ->assertHeader('Content-Security-Policy', "frame-ancestors 'self'; base-uri 'self'; object-src 'none'; script-src 'self'");

    $this->get(route('home'))
        ->assertOk()
        ->assertHeader('Content-Security-Policy', "frame-ancestors 'self'; base-uri 'self'; object-src 'none'; script-src 'self' https://vlibras.gov.br https://cdn.jsdelivr.net");
});

it('keeps Vite development scripts usable outside production', function (): void {
    $this->get(route('admin.login'))
        ->assertOk()
        ->assertHeader('Content-Security-Policy', "frame-ancestors 'self'; base-uri 'self'; object-src 'none'");
});

it('renders Azon-branded verification and password reset emails in Portuguese', function (): void {
    config(['app.url' => 'https://azonsocial.org.br']);
    app()->setLocale('pt_BR');

    $user = $this->cmsUser();
    $verification = (new VerifyEmail)->toMail($user);
    $verificationHtml = (string) $verification->render();

    expect($verification->subject)->toBe('Confirme seu endereço de e-mail')
        ->and($verificationHtml)->toContain(
            'https://azonsocial.org.br/azon-social-share-v2.png',
            'alt="Azon Social"',
            'Instituto Azon Social',
            'Confirmar e-mail',
            'Todos os direitos reservados.',
        );

    $reset = (new ResetPassword('test-token'))->toMail($user);

    expect($reset->subject)->toBe('Redefina sua senha')
        ->and((string) $reset->render())->toContain('Redefinir senha', 'Azon Social');
});

it('accepts a relative email verification signature after redirecting to the admin host', function (): void {
    config(['app.url' => 'https://azonsocial.org.br']);
    $user = $this->cmsUser();
    $user->forceFill(['email_verified_at' => null])->save();

    $verificationUrl = (new VerifyEmail)->toMail($user)->actionUrl;
    expect($verificationUrl)->toStartWith('https://azonsocial.org.br/admin/verificar-email/');

    $adminVerificationUrl = str_replace(
        'https://azonsocial.org.br',
        'https://admin.azonsocial.org.br',
        $verificationUrl,
    );

    $this->get($adminVerificationUrl)->assertRedirect(route('admin.login'));
    expect($user->fresh()->hasVerifiedEmail())->toBeTrue();
});

it('rejects a tampered relative email verification signature', function (): void {
    config(['app.url' => 'https://azonsocial.org.br']);
    $user = $this->cmsUser();
    $user->forceFill(['email_verified_at' => null])->save();

    $verificationUrl = (new VerifyEmail)->toMail($user)->actionUrl;
    $tamperedUrl = str_replace(
        'https://azonsocial.org.br',
        'https://admin.azonsocial.org.br',
        $verificationUrl,
    ).'&altered=1';

    $this->get($tamperedUrl)->assertForbidden();
    expect($user->fresh()->hasVerifiedEmail())->toBeFalse();
});

it('rejects an expired relative email verification signature', function (): void {
    config(['app.url' => 'https://azonsocial.org.br']);
    $user = $this->cmsUser();
    $user->forceFill(['email_verified_at' => null])->save();

    $verificationUrl = (new VerifyEmail)->toMail($user)->actionUrl;
    $expiredUrl = str_replace(
        'https://azonsocial.org.br',
        'https://admin.azonsocial.org.br',
        $verificationUrl,
    );
    $this->travel(61)->minutes();

    $this->get($expiredUrl)->assertForbidden();
    expect($user->fresh()->hasVerifiedEmail())->toBeFalse();
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

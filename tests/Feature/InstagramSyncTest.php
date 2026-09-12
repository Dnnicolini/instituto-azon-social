<?php

use App\Models\Post;
use App\Models\SocialIntegration;
use App\Services\InstagramFeedSynchronizer;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;

it('schedules the automatic Instagram sync every four hours', function (): void {
    $event = collect(app(Schedule::class)->events())
        ->first(fn ($event): bool => str_contains($event->command ?? '', 'instagram:sync'));

    expect($event)->not->toBeNull()
        ->and($event->expression)->toBe('0 */4 * * *');
});

it('skips the automatic Instagram sync cleanly while the integration is inactive', function (): void {
    config([
        'services.instagram.enabled' => false,
        'services.instagram.access_token' => null,
    ]);

    $this->artisan('instagram:sync')
        ->expectsOutput('Instagram ainda não conectado; sincronização automática ignorada.')
        ->assertSuccessful();

    $this->assertDatabaseCount('social_integrations', 0);
});

it('imports Instagram publications idempotently with their official caption and local image', function (): void {
    Storage::fake('public');
    config([
        'services.instagram.enabled' => true,
        'services.instagram.access_token' => 'test-long-lived-token',
        'services.instagram.account_id' => '17841400000000000',
        'services.instagram.username' => 'azon.social',
    ]);

    $image = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=');
    Http::fake([
        'https://graph.instagram.com/*' => Http::response([
            'data' => [[
                'id' => '18000000000000001',
                'caption' => "Legenda oficial da publicação.\n\nSegundo parágrafo.",
                'media_type' => 'IMAGE',
                'media_url' => 'https://images.cdninstagram.com/test-image.png',
                'permalink' => 'https://www.instagram.com/p/Test123/',
                'timestamp' => '2026-09-10T12:00:00+0000',
                'username' => 'azon.social',
            ]],
        ]),
        'https://images.cdninstagram.com/*' => Http::response($image, 200, ['Content-Type' => 'image/png']),
    ]);

    $first = app(InstagramFeedSynchronizer::class)->sync();
    $second = app(InstagramFeedSynchronizer::class)->sync();

    expect($first)->toMatchArray(['created' => 1, 'updated' => 0, 'processed' => 1])
        ->and($second)->toMatchArray(['created' => 0, 'updated' => 1, 'processed' => 1]);
    $this->assertDatabaseCount('posts', 1);
    $this->assertDatabaseHas('posts', [
        'provider' => 'instagram',
        'provider_media_id' => '18000000000000001',
        'body' => "Legenda oficial da publicação.\n\nSegundo parágrafo.",
        'external_url' => 'https://www.instagram.com/p/Test123/',
    ]);

    $post = Post::query()->with('cover')->firstOrFail();
    expect($post->cover?->url)->toBe('/storage/instagram/18000000000000001.png');
    Storage::disk('public')->assertExists('instagram/18000000000000001.png');
    expect(Http::recorded(fn ($request): bool => str_contains($request->url(), 'test-image.png')))->toHaveCount(1);
});

it('does not follow redirects while downloading Instagram media', function (): void {
    Storage::fake('public');
    config([
        'services.instagram.enabled' => true,
        'services.instagram.access_token' => 'test-long-lived-token',
    ]);
    Http::fake([
        'https://graph.instagram.com/*' => Http::response(['data' => [[
            'id' => '18000000000000003',
            'caption' => 'Publicação com imagem redirecionada.',
            'media_type' => 'IMAGE',
            'media_url' => 'https://images.cdninstagram.com/redirected-image.jpg',
            'permalink' => 'https://www.instagram.com/p/Redirect123/',
            'timestamp' => '2026-09-10T12:00:00+0000',
        ]]]),
        'https://images.cdninstagram.com/*' => Http::response('', 302, [
            'Location' => 'http://127.0.0.1/private-image.jpg',
        ]),
    ]);

    app(InstagramFeedSynchronizer::class)->sync();

    expect(Post::query()->firstOrFail()->cover_media_id)->toBeNull();
    Http::assertNotSent(fn ($request): bool => str_starts_with($request->url(), 'http://127.0.0.1/'));
});

it('never persists the Instagram token in a transport error', function (): void {
    config([
        'services.instagram.enabled' => true,
        'services.instagram.access_token' => 'sensitive-test-token',
    ]);
    Http::fake([
        'https://graph.instagram.com/*' => Http::failedConnection(
            'Failed request to https://graph.instagram.com/me/media?access_token=sensitive-test-token',
        ),
    ]);

    expect(fn () => app(InstagramFeedSynchronizer::class)->sync())
        ->toThrow(RuntimeException::class);

    $integration = SocialIntegration::query()->where('provider', 'instagram')->firstOrFail();
    expect($integration->last_error)
        ->not->toContain('sensitive-test-token')
        ->toContain('[credencial protegida]');
});

it('keeps curated highlight settings when a known Instagram publication is synchronized', function (): void {
    config([
        'services.instagram.enabled' => true,
        'services.instagram.access_token' => 'test-long-lived-token',
    ]);
    Post::query()->create([
        'type' => 'social',
        'title' => 'Publicação fixada',
        'slug' => 'publicacao-fixada-instagram',
        'status' => 'published',
        'published_at' => now()->subDay(),
        'provider' => 'instagram',
        'external_url' => 'https://www.instagram.com/p/Featured123/',
        'is_featured' => true,
        'sort_order' => 10,
    ]);
    Http::fake([
        'https://graph.instagram.com/*' => Http::response(['data' => [[
            'id' => '18000000000000002',
            'caption' => 'Legenda atualizada pela conta oficial.',
            'media_type' => 'IMAGE',
            'permalink' => 'https://www.instagram.com/p/Featured123/',
            'timestamp' => '2026-09-10T12:00:00+0000',
        ]]]),
    ]);

    app(InstagramFeedSynchronizer::class)->sync();

    $post = Post::query()->firstOrFail();
    expect($post->provider_media_id)->toBe('18000000000000002')
        ->and($post->is_featured)->toBeTrue()
        ->and($post->sort_order)->toBe(10);
});

it('renews and encrypts the Instagram access token', function (): void {
    config([
        'services.instagram.enabled' => true,
        'services.instagram.access_token' => 'old-token',
    ]);
    Http::fake([
        'https://graph.instagram.com/refresh_access_token*' => Http::response([
            'access_token' => 'refreshed-token',
            'expires_in' => 5_184_000,
        ]),
    ]);

    expect(app(InstagramFeedSynchronizer::class)->refreshToken())->toBeTrue();

    $integration = SocialIntegration::query()->where('provider', 'instagram')->firstOrFail();
    expect($integration->access_token)->toBe('refreshed-token')
        ->and($integration->getRawOriginal('access_token'))->not->toContain('refreshed-token')
        ->and($integration->token_expires_at)->not->toBeNull();
});

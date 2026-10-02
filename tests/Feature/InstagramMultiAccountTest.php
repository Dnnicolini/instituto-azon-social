<?php

use App\Jobs\SyncInstagramAccount;
use App\Models\Permission;
use App\Models\Post;
use App\Models\SocialIntegration;
use App\Services\InstagramFeedSynchronizer;
use Database\Seeders\InstagramIntegrationSeeder;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Queue;

it('seeds the verified configurable profiles without inventing an extra Presente account', function (): void {
    $this->seed(InstagramIntegrationSeeder::class);

    expect(SocialIntegration::query()->where('provider', 'instagram')->count())->toBe(5)
        ->and(SocialIntegration::query()->where('group_key', 'presente')->count())->toBe(1)
        ->and(SocialIntegration::query()->where('expected_username', 'presente.iemanja')->exists())->toBeFalse();
});

it('queues one unique account sync from the manual endpoint', function (): void {
    Queue::fake();
    $administrator = $this->cmsUser();
    $integration = SocialIntegration::query()->create([
        'provider' => 'instagram', 'display_name' => 'Azon News', 'expected_username' => 'azon.news',
        'username' => 'azon.news', 'account_id' => '12345', 'access_token' => 'secret', 'enabled' => true,
    ]);

    $this->actingAs($administrator)->post(route('admin.instagram.sync', $integration))->assertRedirect();

    Queue::assertPushed(SyncInstagramAccount::class, fn (SyncInstagramAccount $job): bool => $job->integrationId === $integration->id && $job->trigger === 'manual');
});

it('requires publication permission before enabling automatic publication', function (): void {
    $editor = $this->cmsUser('editor');
    $role = $editor->roles()->firstOrFail();
    $role->permissions()->attach(Permission::query()->where('slug', 'instagram.manage')->firstOrFail());
    $integration = SocialIntegration::query()->create([
        'provider' => 'instagram', 'display_name' => 'Azon', 'expected_username' => 'azon.social',
    ]);

    $this->actingAs($editor)->patch(route('admin.instagram.update', $integration), [
        'display_name' => 'Azon', 'expected_username' => 'azon.social', 'auto_publish' => true,
    ])->assertForbidden();

    expect($integration->fresh()->auto_publish)->toBeFalse();
});

it('rejects an OAuth account whose username differs from the configured profile', function (): void {
    config(['services.instagram.client_id' => 'app-id', 'services.instagram.client_secret' => 'app-secret']);
    $administrator = $this->cmsUser();
    $integration = SocialIntegration::query()->create(['provider' => 'instagram', 'display_name' => 'Azon News', 'expected_username' => 'azon.news']);
    Http::fake([
        'https://api.instagram.com/oauth/access_token' => Http::response(['access_token' => 'short-token', 'user_id' => '12345']),
        'https://graph.instagram.com/access_token*' => Http::response(['access_token' => 'long-token', 'expires_in' => 5_184_000]),
        'https://graph.instagram.com/12345*' => Http::response(['user_id' => '12345', 'username' => 'wrong.profile']),
    ]);

    $response = $this->actingAs($administrator)->withSession(['instagram_oauth_state' => ['token' => str_repeat('a', 64), 'integration_id' => $integration->id]])
        ->get(route('admin.instagram.callback', ['code' => 'valid-code', 'state' => str_repeat('a', 64)]));

    $response->assertRedirect(route('admin.instagram.index'))->assertSessionHasErrors('instagram');
    expect($integration->fresh()->access_token)->toBeNull();
});

it('stores a successful OAuth connection encrypted and queues the first synchronization', function (): void {
    Queue::fake();
    config(['services.instagram.client_id' => 'app-id', 'services.instagram.client_secret' => 'app-secret']);
    $administrator = $this->cmsUser();
    $integration = SocialIntegration::query()->create([
        'provider' => 'instagram', 'display_name' => 'Azon News', 'expected_username' => 'azon.news',
    ]);
    Http::fake([
        'https://api.instagram.com/oauth/access_token' => Http::response(['access_token' => 'short-token', 'user_id' => '12345']),
        'https://graph.instagram.com/access_token*' => Http::response(['access_token' => 'long-token', 'expires_in' => 5_184_000]),
        'https://graph.instagram.com/12345*' => Http::response(['user_id' => '12345', 'username' => 'azon.news']),
    ]);

    $this->actingAs($administrator)
        ->withSession(['instagram_oauth_state' => ['token' => str_repeat('a', 64), 'integration_id' => $integration->id]])
        ->get(route('admin.instagram.callback', ['code' => 'valid-code', 'state' => str_repeat('a', 64)]))
        ->assertRedirect(route('admin.instagram.index'))
        ->assertSessionHas('success');

    $integration->refresh();
    expect($integration->access_token)->toBe('long-token')
        ->and($integration->getRawOriginal('access_token'))->not->toContain('long-token')
        ->and($integration->enabled)->toBeTrue();
    Queue::assertPushed(SyncInstagramAccount::class, fn (SyncInstagramAccount $job): bool => $job->integrationId === $integration->id && $job->trigger === 'oauth');
});

it('keeps editorial state and copy when an automatic publication is synchronized again', function (): void {
    $integration = SocialIntegration::query()->create([
        'provider' => 'instagram', 'display_name' => 'Azon', 'expected_username' => 'azon.social',
        'username' => 'azon.social', 'account_id' => '12345', 'access_token' => 'token', 'enabled' => true,
    ]);
    $post = Post::query()->create([
        'type' => 'social', 'title' => 'Título editorial', 'slug' => 'instagram-18000000000000009', 'status' => 'archived',
        'provider' => 'instagram', 'social_integration_id' => $integration->id, 'provider_media_id' => '18000000000000009',
        'source_type' => 'automatic', 'editorial_summary' => 'Resumo editorial', 'source_available' => false,
        'is_featured' => true, 'sort_order' => 7,
    ]);
    Http::fake(['https://graph.instagram.com/*' => Http::response(['data' => [[
        'id' => '18000000000000009', 'caption' => 'Legenda atualizada', 'media_type' => 'IMAGE',
        'permalink' => 'https://www.instagram.com/p/Updated123/', 'timestamp' => now()->toIso8601String(), 'username' => 'azon.social',
    ]]])]);

    app(InstagramFeedSynchronizer::class)->syncAccount($integration);
    $post->refresh();

    expect($post->status->value)->toBe('archived')->and($post->title)->toBe('Título editorial')
        ->and($post->editorial_summary)->toBe('Resumo editorial')->and($post->is_featured)->toBeTrue()->and($post->sort_order)->toBe(7)
        ->and($post->original_caption)->toBe('Legenda atualizada')->and($post->source_available)->toBeFalse();
});

it('imports an initial history through bounded cursor pagination without duplicates', function (): void {
    $integration = SocialIntegration::query()->create([
        'provider' => 'instagram', 'display_name' => 'Azon', 'expected_username' => 'azon.social',
        'username' => 'azon.social', 'account_id' => '12345', 'access_token' => 'token', 'enabled' => true,
    ]);
    Http::fake(function (Request $request) {
        $after = $request->data()['after'] ?? null;

        return Http::response($after
            ? ['data' => [[
                'id' => '18000000000000002', 'caption' => 'Segunda publicação', 'media_type' => 'IMAGE',
                'permalink' => 'https://www.instagram.com/p/PageTwo/', 'timestamp' => now()->subDay()->toIso8601String(), 'username' => 'azon.social',
            ]]]
            : ['data' => [[
                'id' => '18000000000000001', 'caption' => 'Primeira publicação', 'media_type' => 'IMAGE',
                'permalink' => 'https://www.instagram.com/p/PageOne/', 'timestamp' => now()->toIso8601String(), 'username' => 'azon.social',
            ]], 'paging' => ['cursors' => ['after' => 'cursor-2']]]);
    });

    $first = app(InstagramFeedSynchronizer::class)->syncAccount($integration, 2);
    $second = app(InstagramFeedSynchronizer::class)->syncAccount($integration, 2);

    expect($first)->toMatchArray(['created' => 2, 'processed' => 2])
        ->and($second)->toMatchArray(['created' => 0, 'updated' => 2, 'processed' => 2])
        ->and(Post::query()->where('social_integration_id', $integration->id)->count())->toBe(2);
    Http::assertSentCount(4);
});

it('returns only published posts from publicly enabled accounts', function (): void {
    $public = SocialIntegration::query()->create(['provider' => 'instagram', 'display_name' => 'Público', 'expected_username' => 'publico', 'public_enabled' => true, 'display_locations' => ['social_feed']]);
    $private = SocialIntegration::query()->create(['provider' => 'instagram', 'display_name' => 'Privado', 'expected_username' => 'privado', 'public_enabled' => false]);
    foreach ([[$public, 'visivel'], [$private, 'oculto']] as [$account, $slug]) {
        Post::query()->create(['type' => 'social', 'title' => $slug, 'slug' => $slug, 'status' => 'published', 'published_at' => now(), 'provider' => 'instagram', 'social_integration_id' => $account->id, 'source_type' => 'automatic']);
    }

    $this->getJson(route('instagram.publications'))->assertOk()->assertJsonPath('total', 1)->assertJsonPath('data.0.title', 'visivel');
});

it('disconnects credentials without deleting configuration or imported posts', function (): void {
    $administrator = $this->cmsUser();
    $integration = SocialIntegration::query()->create([
        'provider' => 'instagram', 'display_name' => 'Azon', 'expected_username' => 'azon.social',
        'username' => 'azon.social', 'account_id' => '12345', 'access_token' => 'secret', 'enabled' => true,
    ]);
    $post = Post::query()->create([
        'type' => 'social', 'title' => 'Preservada', 'slug' => 'preservada', 'status' => 'review',
        'provider' => 'instagram', 'social_integration_id' => $integration->id, 'source_type' => 'automatic',
    ]);

    $this->actingAs($administrator)->delete(route('admin.instagram.destroy', $integration))->assertRedirect();

    expect($integration->fresh())->not->toBeNull()
        ->and($integration->fresh()->access_token)->toBeNull()
        ->and($integration->fresh()->enabled)->toBeFalse()
        ->and($post->fresh())->not->toBeNull();
});

it('preserves automatic source metadata when a curator edits the publication', function (): void {
    $publisher = $this->cmsUser('publisher');
    $integration = SocialIntegration::query()->create([
        'provider' => 'instagram', 'display_name' => 'Azon', 'expected_username' => 'azon.social',
    ]);
    $post = Post::query()->create([
        'type' => 'social', 'title' => 'Original', 'slug' => 'original', 'status' => 'review',
        'provider' => 'instagram', 'external_url' => 'https://www.instagram.com/p/Original123/',
        'social_integration_id' => $integration->id, 'provider_media_id' => '18000000000000009',
        'source_type' => 'automatic', 'original_caption' => 'Legenda da origem',
    ]);

    $this->actingAs($publisher)->put(route('admin.posts.update', ['post' => $post, 'section' => 'social']), [
        'type' => 'social', 'title' => 'Título editorial', 'slug' => 'original', 'status' => 'review',
        'source_mode' => 'link', 'provider' => 'instagram', 'external_url' => $post->external_url,
        'editorial_summary' => 'Resumo público',
    ])->assertRedirect();

    $post->refresh();
    expect($post->source_type)->toBe('automatic')
        ->and($post->social_integration_id)->toBe($integration->id)
        ->and($post->provider_media_id)->toBe('18000000000000009')
        ->and($post->original_caption)->toBe('Legenda da origem')
        ->and($post->editorial_summary)->toBe('Resumo público');
});

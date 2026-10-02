<?php

use App\Enums\ContentStatus;
use App\Enums\PostType;
use App\Models\Page;
use App\Models\Post;
use App\Models\SocialIntegration;
use Database\Seeders\ContentSeeder;
use Database\Seeders\InstagramIntegrationSeeder;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function (): void {
    $this->withoutVite();
    config(['inertia.ssr.enabled' => false]);
});

it('seeds and links every managed channel to its official Instagram profile', function (): void {
    $this->seed(ContentSeeder::class);
    $this->seed(InstagramIntegrationSeeder::class);
    $this->seed(InstagramIntegrationSeeder::class);

    $expected = [
        'azon-news' => 'azon.news',
        'azon-podcast' => 'azon.cast',
        'hunkpame-azon-legidan' => 'azonlegidan',
        'presente-de-iemanja-sepetiba' => 'presente.sepetiba',
    ];

    foreach ($expected as $slug => $username) {
        $page = Page::query()->with('socialIntegration')->where('slug', $slug)->firstOrFail();
        expect($page->socialIntegration?->expected_username)->toBe($username);
    }

    expect(SocialIntegration::query()->whereIn('expected_username', array_values($expected))->count())->toBe(4)
        ->and(SocialIntegration::query()->where('expected_username', 'presente.iemanja')->exists())->toBeFalse();
});

it('lists the four channels in their dedicated CRM management page', function (): void {
    $this->seed(ContentSeeder::class);
    $this->seed(InstagramIntegrationSeeder::class);
    $administrator = $this->cmsUser('administrator');

    $this->actingAs($administrator)
        ->get(route('admin.channels.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page): Assert => $page
            ->component('admin/channels/index')
            ->has('channels', 4)
            ->where('channels.0.slug', 'azon-news')
            ->where('channels.1.slug', 'azon-podcast')
            ->where('channels.2.slug', 'hunkpame-azon-legidan')
            ->where('channels.3.slug', 'presente-de-iemanja-sepetiba'));
});

it('updates and reorders channel sections then returns to the channel listing', function (): void {
    $this->seed(ContentSeeder::class);
    $this->seed(InstagramIntegrationSeeder::class);
    $publisher = $this->cmsUser('publisher');
    $page = Page::query()->where('slug', 'azon-news')->firstOrFail();
    $integration = SocialIntegration::query()->where('expected_username', 'azon.news')->firstOrFail();

    $sections = [
        ['type' => 'text', 'title' => 'Segunda seção', 'text' => 'Agora aparece primeiro.'],
        ['type' => 'hero', 'title' => 'Abertura', 'text' => 'Agora aparece depois.'],
    ];

    $this->actingAs($publisher)->put(route('admin.pages.update', $page), [
        'title' => $page->title,
        'slug' => $page->slug,
        'social_integration_id' => $integration->id,
        'sections' => $sections,
        'status' => 'published',
        'return_to' => 'channels',
    ])->assertRedirect(route('admin.channels.index'))
        ->assertSessionHas('success', 'Página atualizada com sucesso.');

    expect($page->fresh()->sections)->toBe($sections);
});

it('requires Instagram management permission to change the account linked to a channel', function (): void {
    $this->seed(ContentSeeder::class);
    $this->seed(InstagramIntegrationSeeder::class);
    $publisher = $this->cmsUser('publisher');
    $page = Page::query()->where('slug', 'azon-news')->firstOrFail();
    $other = SocialIntegration::query()->create([
        'provider' => 'instagram',
        'display_name' => 'Perfil ainda não vinculado',
        'expected_username' => 'perfil.novo',
    ]);

    $this->actingAs($publisher)->put(route('admin.pages.update', $page), [
        'title' => $page->title,
        'slug' => $page->slug,
        'social_integration_id' => $other->id,
        'sections' => $page->sections,
        'status' => 'published',
    ])->assertForbidden();

    expect($page->fresh()->social_integration_id)->not->toBe($other->id);
});

it('protects channel slugs and channel pages from deletion', function (): void {
    $this->seed(ContentSeeder::class);
    $administrator = $this->cmsUser('administrator');
    $page = Page::query()->where('slug', 'azon-news')->firstOrFail();

    $this->actingAs($administrator)->put(route('admin.pages.update', $page), [
        'title' => $page->title,
        'slug' => 'outro-endereco',
        'sections' => $page->sections,
        'status' => 'published',
    ])->assertSessionHasErrors('slug');

    $this->actingAs($administrator)
        ->delete(route('admin.pages.destroy', $page))
        ->assertUnprocessable();

    expect($page->fresh())->not->toBeNull();
});

it('shows only published posts from the Instagram account linked to the channel', function (): void {
    $primary = SocialIntegration::query()->create([
        'provider' => 'instagram',
        'display_name' => 'Azon News',
        'expected_username' => 'azon.news',
        'group_key' => 'azon-news',
        'display_locations' => ['azon_news'],
        'public_enabled' => true,
    ]);
    $other = SocialIntegration::query()->create([
        'provider' => 'instagram',
        'display_name' => 'Outro perfil',
        'expected_username' => 'outro.perfil',
        'group_key' => 'outro',
        'display_locations' => ['azon_news'],
        'public_enabled' => true,
    ]);
    $page = Page::query()->create([
        'title' => 'Azon News',
        'slug' => 'azon-news',
        'social_integration_id' => $primary->id,
        'status' => ContentStatus::Published,
        'published_at' => now()->subDay(),
    ]);

    foreach ([
        [$primary, 'Publicação correta', ContentStatus::Published, true],
        [$primary, 'Ainda em revisão', ContentStatus::Review, true],
        [$primary, 'Fonte indisponível', ContentStatus::Published, false],
        [$other, 'Publicação de outra conta', ContentStatus::Published, true],
    ] as [$integration, $title, $status, $available]) {
        Post::query()->create([
            'type' => PostType::Social,
            'title' => $title,
            'slug' => str($title)->slug()->toString(),
            'provider' => 'instagram',
            'social_integration_id' => $integration->id,
            'source_available' => $available,
            'status' => $status,
            'published_at' => now()->subHour(),
        ]);
    }

    $this->get(route('pages.show', $page->slug))
        ->assertOk()
        ->assertInertia(fn (Assert $response): Assert => $response
            ->component('page')
            ->has('socialPosts', 1)
            ->where('socialPosts.0.title', 'Publicação correta'));
});

it('can group two distinct Presente profiles on the same initiative page', function (): void {
    $this->seed(ContentSeeder::class);
    $this->seed(InstagramIntegrationSeeder::class);
    $page = Page::query()->where('slug', 'presente-de-iemanja-sepetiba')->firstOrFail();
    $primary = $page->socialIntegration()->firstOrFail();
    $primary->update(['public_enabled' => true]);
    $secondary = SocialIntegration::query()->create([
        'provider' => 'instagram',
        'display_name' => 'Presente a Iemanjá',
        'expected_username' => 'presente.iemanja',
        'group_key' => 'presente',
        'display_locations' => ['presente'],
        'public_enabled' => true,
    ]);

    foreach ([[$primary, 'Perfil Sepetiba'], [$secondary, 'Perfil Iemanjá']] as [$integration, $title]) {
        Post::query()->create([
            'type' => PostType::Social,
            'title' => $title,
            'slug' => str($title)->slug()->toString(),
            'provider' => 'instagram',
            'social_integration_id' => $integration->id,
            'source_available' => true,
            'status' => ContentStatus::Published,
            'published_at' => now()->subHour(),
        ]);
    }

    $this->get(route('pages.show', $page->slug))
        ->assertOk()
        ->assertInertia(fn (Assert $response): Assert => $response
            ->has('socialPosts', 2));
});

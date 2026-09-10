<?php

use App\Enums\ContentStatus;
use App\Enums\PostType;
use App\Models\ContactMessage;
use App\Models\Post;
use Database\Seeders\ContentSeeder;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function (): void {
    $this->withoutVite();
    config(['app.url' => 'https://azon.example', 'inertia.ssr.enabled' => false]);
});

it('persists a valid contact message but rejects the honeypot and invalid input', function (): void {
    $this->post(route('contact.store'), ['name' => 'Maria', 'email' => 'maria@example.org', 'subject' => 'Parceria', 'message' => 'Gostaria de conhecer melhor o projeto.', 'website' => ''])
        ->assertRedirect()->assertSessionHas('success');
    expect(ContactMessage::query()->first()?->ip_hash)->not->toBeNull();

    $this->post(route('contact.store'), ['name' => 'Robô', 'email' => 'bot@example.org', 'message' => 'Mensagem automatizada de spam', 'website' => 'https://spam.invalid'])
        ->assertSessionHasErrors('website');
    $this->assertDatabaseCount('contact_messages', 1);
});

it('shows only published media and supports type and search filters', function (): void {
    Post::query()->create(['type' => PostType::Video, 'title' => 'Cultura em Sepetiba', 'slug' => 'cultura-sepetiba', 'excerpt' => 'Memória comunitária', 'status' => ContentStatus::Published, 'published_at' => now()->subMinute(), 'external_url' => 'https://example.org/video']);
    Post::query()->create(['type' => PostType::Podcast, 'title' => 'Conversa privada', 'slug' => 'conversa-privada', 'status' => ContentStatus::Draft, 'external_url' => 'https://example.org/audio']);

    $this->get(route('media.index', ['type' => 'video', 'search' => 'Sepetiba']))->assertOk()->assertInertia(fn (Assert $page): Assert => $page
        ->component('media/index')->where('filters.type', 'video')->where('filters.search', 'Sepetiba')
        ->has('posts.data', 1)->where('posts.data.0.slug', 'cultura-sepetiba'));
    $this->get(route('media.show', 'cultura-sepetiba'))->assertOk();
    $this->get(route('media.show', 'conversa-privada'))->assertNotFound();
});

it('keeps draft and future media out of sitemap and RSS', function (): void {
    Post::query()->create(['type' => PostType::Podcast, 'title' => 'Publicado', 'slug' => 'publicado', 'status' => ContentStatus::Published, 'published_at' => now()->subMinute(), 'external_url' => 'https://example.org/podcast']);
    Post::query()->create(['type' => PostType::Podcast, 'title' => 'Futuro', 'slug' => 'futuro', 'status' => ContentStatus::Published, 'published_at' => now()->addDay(), 'external_url' => 'https://example.org/futuro']);

    $this->get(route('podcast'))->assertOk()->assertSeeText('Publicado')->assertDontSeeText('Futuro');
    $this->get(route('sitemap'))->assertOk()->assertSee('/midia/publicado', false)->assertDontSee('/midia/futuro', false)->assertDontSee('/admin', false);
});

it('seeds current content and editable structured home sections idempotently', function (): void {
    $this->seed(ContentSeeder::class);
    $this->seed(ContentSeeder::class);

    $this->assertDatabaseCount('projects', 4);
    $this->assertDatabaseCount('events', 3);
    $this->assertDatabaseCount('pages', 1);
    $this->assertDatabaseHas('events', ['slug' => 'selecao-lewa-ori', 'starts_at' => null, 'date_label' => 'Inscrições abertas']);

    $this->get(route('home'))->assertOk()->assertInertia(fn (Assert $page): Assert => $page
        ->has('page.sections', 5)->has('settings')->has('posts', 3)->has('projects', 4)->has('events', 3));
});

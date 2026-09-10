<?php

use App\Enums\ContentStatus;
use App\Models\Event;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function (): void {
    $this->withoutVite();
    config([
        'app.url' => 'https://azon.example',
        'inertia.ssr.enabled' => false,
    ]);
});

it('shows relevant published calendar events and keeps unpublished content private', function (): void {
    foreach (range(1, 14) as $day) {
        Event::query()->create([
            'title' => "Ação comunitária {$day}",
            'slug' => "acao-comunitaria-{$day}",
            'summary' => 'Resumo público',
            'body' => 'Descrição completa da atividade.',
            'location' => 'Sepetiba, Rio de Janeiro',
            'starts_at' => "2026-10-{$day} 14:00:00",
            'registration_url' => 'https://example.org/inscricao',
            'participation_details' => 'Leve um documento com foto e confirme a inscrição.',
            'status' => ContentStatus::Published,
            'published_at' => now()->subMinute(),
        ]);
    }
    Event::query()->create([
        'title' => 'Evento em rascunho',
        'slug' => 'evento-em-rascunho',
        'location' => 'Sepetiba',
        'starts_at' => '2026-10-20 10:00:00',
        'status' => ContentStatus::Draft,
    ]);

    $this->get(route('calendar'))->assertOk()->assertInertia(
        fn (Assert $page): Assert => $page
            ->component('calendar')
            ->where('seo.canonical', 'https://azon.example/calendario')
            ->has('events', 14)
            ->missing('events.0.body')
            ->missing('events.0.participation_details')
            ->missing('events.0.cover_url'),
    );

    $this->getJson(route('calendar.events.show', 'acao-comunitaria-1'))
        ->assertOk()
        ->assertHeader('Cache-Control', 'max-age=300, public, stale-while-revalidate=600')
        ->assertJsonPath('event.body', 'Descrição completa da atividade.')
        ->assertJsonPath('event.participation_details', 'Leve um documento com foto e confirme a inscrição.')
        ->assertJsonPath('event.registration_url', 'https://example.org/inscricao');

    $this->getJson(route('calendar.events.show', 'evento-em-rascunho'))
        ->assertNotFound();
});

it('keeps future and continuous activities visible after a large event history', function (): void {
    $history = collect(range(1, 501))->map(fn (int $index): array => [
        'title' => "Evento histórico {$index}",
        'slug' => "evento-historico-{$index}",
        'starts_at' => now()->subYears(2)->subDays($index),
        'status' => ContentStatus::Published->value,
        'published_at' => now()->subYears(2),
        'created_at' => now()->subYears(2),
        'updated_at' => now()->subYears(2),
    ])->all();
    foreach (array_chunk($history, 100) as $chunk) {
        Event::query()->insert($chunk);
    }
    Event::query()->create([
        'title' => 'Próxima ação',
        'slug' => 'proxima-acao',
        'starts_at' => now()->addMonth(),
        'status' => ContentStatus::Published,
        'published_at' => now()->subMinute(),
    ]);
    Event::query()->create([
        'title' => 'Atividade contínua',
        'slug' => 'atividade-continua',
        'starts_at' => null,
        'date_label' => 'Inscrições abertas',
        'status' => ContentStatus::Published,
        'published_at' => now()->subMinute(),
    ]);

    $this->get(route('calendar'))->assertOk()->assertInertia(
        fn (Assert $page): Assert => $page
            ->has('events', 2)
            ->where('events.0.slug', 'proxima-acao')
            ->where('events.1.slug', 'atividade-continua'),
    );
});

it('stores the editable participation instructions through the protected CRM', function (): void {
    $publisher = $this->cmsUser('publisher');

    $this->actingAs($publisher)->post(route('admin.events.store'), [
        'title' => 'Oficina de saúde preventiva',
        'slug' => 'oficina-saude-preventiva',
        'summary' => 'Encontro de cuidado comunitário.',
        'body' => 'Orientações e acolhimento para toda a comunidade.',
        'location' => 'Hunkpame Azon Legidan',
        'starts_at' => now()->addMonth()->setTime(10, 0)->toDateTimeString(),
        'registration_url' => 'https://example.org/inscricao',
        'participation_details' => 'Inscrição por e-mail. Atividade gratuita e com vagas limitadas.',
        'status' => 'published',
        'published_at' => now()->subMinute()->toDateTimeString(),
    ])->assertRedirect();

    $this->assertDatabaseHas('events', [
        'slug' => 'oficina-saude-preventiva',
        'participation_details' => 'Inscrição por e-mail. Atividade gratuita e com vagas limitadas.',
        'status' => 'published',
    ]);

    $this->get(route('calendar'))->assertInertia(
        fn (Assert $page): Assert => $page
            ->has('events', 1)
            ->where('events.0.slug', 'oficina-saude-preventiva'),
    );
    $this->getJson(route('calendar.events.show', 'oficina-saude-preventiva'))
        ->assertOk()
        ->assertJsonPath(
            'event.participation_details',
            'Inscrição por e-mail. Atividade gratuita e com vagas limitadas.',
        );
});

it('validates the participation instructions and coherent event dates', function (): void {
    $publisher = $this->cmsUser('publisher');

    $this->actingAs($publisher)->post(route('admin.events.store'), [
        'title' => 'Evento inválido',
        'slug' => 'evento-invalido',
        'location' => 'Sepetiba',
        'starts_at' => '2026-10-20 18:00:00',
        'ends_at' => '2026-10-20 17:00:00',
        'participation_details' => str_repeat('a', 5001),
        'status' => 'draft',
    ])->assertSessionHasErrors(['ends_at', 'participation_details']);
});

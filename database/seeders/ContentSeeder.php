<?php

namespace Database\Seeders;

use App\Enums\ContentStatus;
use App\Enums\PostType;
use App\Models\Event;
use App\Models\MediaAsset;
use App\Models\Page;
use App\Models\Post;
use App\Models\Project;
use App\Models\SiteSetting;
use Illuminate\Database\Seeder;

class ContentSeeder extends Seeder
{
    public function run(): void
    {
        $assets = [
            'sabeje' => $this->asset('evento-sabeje.png', 'Sabeje Sepetiba 2026', 1500, 886),
            'lewa' => $this->asset('evento-lewa-ori.png', 'Projeto Lewa Orí', 883, 881),
            'aman' => $this->asset('evento-aman-mudas.png', 'Projeto Aman — Folhas de Axé', 893, 865),
        ];

        $projects = [
            ['Lewa Orí', 'lewa-ori', 'Acolhimento, escuta qualificada e cuidado emocional como um direito para todas as pessoas.', 10],
            ['Ayidonun', 'ayidonun', 'Alimento como sustento, memória, afeto, dignidade e fortalecimento comunitário.', 20],
            ['Aman', 'aman', 'Valorização das folhas, dos saberes tradicionais e da relação ancestral com a natureza.', 30],
            ['Emi Syó', 'emi-syo', 'Mobilização, defesa de direitos e fortalecimento das vozes do nosso território.', 40],
        ];
        foreach ($projects as [$title, $slug, $summary, $order]) {
            Project::query()->updateOrCreate(['slug' => $slug], [
                'title' => $title,
                'summary' => $summary,
                'body' => $summary,
                'status' => ContentStatus::Published,
                'published_at' => '2026-01-01 12:00:00',
                'sort_order' => $order,
                'cover_media_id' => $slug === 'lewa-ori' ? $assets['lewa']->id : ($slug === 'aman' ? $assets['aman']->id : null),
            ]);
        }

        foreach ([
            ['Lewa Orí: escuta que transforma', 'lewa-ori-escuta-que-transforma', 'Conheça a iniciativa que promove acolhimento e cuidado emocional em comunidade.'],
            ['Cozinha Ancestral Ayidonun', 'cozinha-ancestral-ayidonun', 'Saberes, sabores e afeto reunidos para alimentar pessoas e preservar memórias.'],
            ['Folhas, território e ancestralidade', 'folhas-territorio-e-ancestralidade', 'O projeto Aman fortalece conhecimentos que atravessam gerações.'],
        ] as [$title, $slug, $excerpt]) {
            Post::query()->updateOrCreate(['slug' => $slug], [
                'type' => PostType::Article,
                'title' => $title,
                'excerpt' => $excerpt,
                'body' => $excerpt,
                'status' => ContentStatus::Published,
                'published_at' => '2026-01-01 12:00:00',
            ]);
        }

        $events = [
            ['Sabeje Sepetiba 2026', 'sabeje-2026', 'Caminhos de Axé, tradição e ancestralidade pelas ruas de Sepetiba.', 'Praça Américo Marçal, Sepetiba', '2026-08-29 12:00:00', '29 de agosto de 2026', null, 'sabeje'],
            ['Seleção para o Projeto Lewa Orí', 'selecao-lewa-ori', 'Entrevistas on-line para possível inserção no atendimento psicanalítico gratuito.', 'Atendimento on-line', null, 'Inscrições abertas', 'mailto:instituto.azonsocial@gmail.com?subject=Inscrição%20Projeto%20Lewa%20Orí', 'lewa'],
            ['Cadastro de mudas e ervas — Projeto Aman', 'cadastro-mudas-aman', 'Cadastro para receber mudas e ervas e acompanhar novas plantas disponibilizadas.', 'Rio de Janeiro', null, 'Cadastro contínuo', 'https://forms.gle/gQwuyTMevgnSVNyS9', 'aman'],
        ];
        foreach ($events as [$title, $slug, $summary, $location, $startsAt, $dateLabel, $registrationUrl, $asset]) {
            Event::query()->updateOrCreate(['slug' => $slug], [
                'title' => $title,
                'summary' => $summary,
                'body' => $summary,
                'location' => $location,
                'starts_at' => $startsAt,
                'date_label' => $dateLabel,
                'registration_url' => $registrationUrl,
                'status' => ContentStatus::Published,
                'published_at' => '2026-01-01 12:00:00',
                'cover_media_id' => $assets[$asset]->id,
            ]);
        }

        Page::query()->updateOrCreate(['slug' => 'inicio'], [
            'title' => 'Página inicial',
            'body' => 'Página institucional do Instituto Azon Social.',
            'sections' => [
                ['type' => 'hero', 'eyebrow' => 'Educação • Cultura • Cuidado • Território', 'title' => 'Ancestralidade que cuida.', 'emphasis' => 'Ação que transforma.', 'text' => (string) config('site.description'), 'cta_label' => 'Conheça nossos projetos', 'cta_url' => '#projetos'],
                ['type' => 'intro', 'eyebrow' => 'Quem somos', 'title' => 'Cuidar das pessoas também é preservar nossas raízes.', 'text' => 'Nossa atuação une ancestralidade, cuidado, educação, cultura, defesa de direitos e preservação ambiental.'],
                ['type' => 'history', 'eyebrow' => 'Nossa história', 'title' => 'Experiência comunitária que se transforma em ação.', 'text' => 'O Instituto nasceu dos valores cultivados no Hunkpame Azon Legidan.'],
                ['type' => 'transparency', 'eyebrow' => 'Transparência', 'title' => 'Compromisso público com cada ação.', 'text' => 'Documentos institucionais e resultados disponíveis para a comunidade.'],
                ['type' => 'participate', 'eyebrow' => 'Faça parte', 'title' => 'Vamos transformar juntos.', 'text' => 'Apoie, participe ou proponha uma parceria.', 'cta_label' => 'Entre em contato', 'cta_url' => '#contato'],
            ],
            'status' => ContentStatus::Published,
            'published_at' => '2026-01-01 12:00:00',
            'seo_title' => 'Instituto Azon Social | Ancestralidade, cuidado e transformação',
            'seo_description' => (string) config('site.description'),
        ]);

        foreach ([
            'site_name' => ['Instituto Azon Social', 'text', 'general'],
            'tagline' => ['Ancestralidade que cuida. Ação que transforma.', 'text', 'general'],
            'description' => [(string) config('site.description'), 'textarea', 'seo'],
            'email' => [(string) config('site.email'), 'email', 'contact'],
            'phone' => [(string) config('site.phone_display'), 'text', 'contact'],
            'address' => ['Sepetiba, Rio de Janeiro — RJ', 'text', 'contact'],
            'hero_title' => ['Ancestralidade que cuida.', 'text', 'home'],
            'hero_emphasis' => ['Ação que transforma.', 'text', 'home'],
            'hero_text' => [(string) config('site.description'), 'textarea', 'home'],
        ] as $key => [$value, $type, $group]) {
            SiteSetting::query()->updateOrCreate(['key' => $key], compact('value', 'type', 'group'));
        }
    }

    private function asset(string $path, string $alt, int $width, int $height): MediaAsset
    {
        return MediaAsset::query()->updateOrCreate(
            ['disk' => 'site', 'path' => $path],
            ['original_name' => $path, 'mime_type' => 'image/png', 'size' => 0, 'alt_text' => $alt, 'width' => $width, 'height' => $height],
        );
    }
}

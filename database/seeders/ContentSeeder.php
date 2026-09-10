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
            'hunto' => $this->asset('projeto-hunto.webp', 'Huntó — Mestres dos Saberes', 1024, 1024, 'image/webp'),
            'ayi_gbe' => $this->asset('projeto-ayi-gbe.webp', 'AYI GBÈ — Saúde preventiva e cuidado com o corpo', 1254, 1254, 'image/webp'),
        ];

        $projects = [
            ['Lewa Orí', 'lewa-ori', 'Acolhimento, escuta qualificada e cuidado emocional como um direito para todas as pessoas.', null, 10, $assets['lewa']->id],
            ['Ayidonun', 'ayidonun', 'Alimento como sustento, memória, afeto, dignidade e fortalecimento comunitário.', null, 20, null],
            ['Aman', 'aman', 'Valorização das folhas, dos saberes tradicionais e da relação ancestral com a natureza.', null, 30, $assets['aman']->id],
            ['Emi Syó', 'emi-syo', 'Mobilização, defesa de direitos e fortalecimento das vozes do nosso território.', null, 40, null],
            ['Huntó', 'hunto', 'Mestres dos saberes: valorização, transmissão e continuidade dos conhecimentos ancestrais.', null, 50, $assets['hunto']->id],
            [
                'AYI GBÈ',
                'ayi-gbe',
                'Vida na Terra, cuidado com o corpo e saúde preventiva para valorizar a vida e promover o bem-estar.',
                "AYI GBÈ — Saúde que começa no cuidado com a vida.\n\nAyi representa a dimensão da terra, do mundo e do lugar onde vivemos. Gbè está ligado à ideia de vida, existência e vivência. Assim, AYI GBÈ é um projeto do Instituto Azon Social voltado para a valorização da vida por meio do cuidado com o corpo, da prevenção, da educação em saúde e da promoção do bem-estar.\n\nA proposta trabalha a saúde de maneira preventiva e integral, aproximando conhecimento, comunidade e ancestralidade. O projeto pode desenvolver ações de orientação sobre prevenção de doenças, alimentação, atividade física, saúde do corpo, hábitos saudáveis, acompanhamento e encaminhamento para serviços de saúde quando necessário.\n\nCuidar da vida começa cuidando do corpo e do ambiente em que essa vida existe.",
                60,
                $assets['ayi_gbe']->id,
            ],
        ];
        foreach ($projects as [$title, $slug, $summary, $body, $order, $coverMediaId]) {
            Project::query()->updateOrCreate(['slug' => $slug], [
                'title' => $title,
                'summary' => $summary,
                'body' => $body ?: $summary,
                'status' => ContentStatus::Published,
                'published_at' => '2026-01-01 12:00:00',
                'sort_order' => $order,
                'cover_media_id' => $coverMediaId,
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

        $socialPosts = [
            [
                'Projeto Lewa Orí: saúde mental',
                'instagram-lewa-ori-saude-mental',
                'Acolhimento, escuta qualificada e cuidado emocional com inscrições abertas.',
                'https://www.instagram.com/p/DZuiy3vRHXZ/',
                '2026-06-18 12:00:00',
                true,
                10,
            ],
            [
                'Projeto Aman: mudas que preservam o axé',
                'instagram-projeto-aman-mudas',
                'Doação de mudas de dendezeiros para fortalecer terreiros e preservar folhas sagradas.',
                'https://www.instagram.com/p/DZNc3kZR1-G/',
                '2026-06-05 12:00:00',
                true,
                20,
            ],
            [
                'Há 9 anos, uma ação que virou propósito',
                'instagram-acao-que-virou-proposito',
                'Um registro de cuidado, partilha e responsabilidade coletiva que ajudou a formar o Azon Social.',
                'https://www.instagram.com/p/DdGy-wJEVs_/',
                '2026-09-10 08:00:00',
                false,
                0,
            ],
            [
                'Setembro Amarelo: existe escuta',
                'instagram-setembro-amarelo-existe-escuta',
                'O projeto Lewa Orí reforça que falar alivia, escutar transforma e acolher salva vidas.',
                'https://www.instagram.com/p/DdCzC23uTIk/',
                '2026-09-09 12:00:00',
                false,
                0,
            ],
            [
                '14 anos de resistência',
                'instagram-14-anos-de-resistencia',
                'Ancestralidade e ação no enfrentamento à intolerância e ao racismo religioso.',
                'https://www.instagram.com/p/DdAT2JGNx8g/',
                '2026-09-08 12:00:00',
                false,
                0,
            ],
            [
                'Raízes que seguem vivas',
                'instagram-raizes-que-seguem-vivas',
                'Uma nova identidade para o Hunkpame Azon Legidan, preservando história, natureza e continuidade.',
                'https://www.instagram.com/p/Dc_D8keu35d/',
                '2026-09-07 12:00:00',
                false,
                0,
            ],
        ];
        foreach ($socialPosts as [$title, $slug, $excerpt, $url, $publishedAt, $featured, $sortOrder]) {
            Post::query()->updateOrCreate(['slug' => $slug], [
                'type' => PostType::Social,
                'title' => $title,
                'excerpt' => $excerpt,
                'body' => $excerpt,
                'provider' => 'instagram',
                'external_url' => $url,
                'is_featured' => $featured,
                'sort_order' => $sortOrder,
                'status' => ContentStatus::Published,
                'published_at' => $publishedAt,
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

    private function asset(string $path, string $alt, int $width, int $height, string $mimeType = 'image/png'): MediaAsset
    {
        return MediaAsset::query()->updateOrCreate(
            ['disk' => 'site', 'path' => $path],
            ['original_name' => $path, 'mime_type' => $mimeType, 'size' => 0, 'alt_text' => $alt, 'width' => $width, 'height' => $height],
        );
    }
}

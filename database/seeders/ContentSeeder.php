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
            'social_lewa' => $this->asset('social/instagram-lewa-ori.webp', 'Publicação do projeto Lewa Orí sobre atendimento psicanalítico', 1080, 1080, 'image/webp'),
            'social_aman' => $this->asset('social/instagram-aman-mudas.webp', 'Publicação sobre a doação de dendezeiros do projeto Aman', 1080, 1080, 'image/webp'),
            'social_proposito' => $this->asset('social/instagram-acao-proposito.webp', 'Publicação sobre nove anos de uma ação solidária do Azon Social', 1080, 1080, 'image/webp'),
            'social_setembro' => $this->asset('social/instagram-setembro-amarelo.webp', 'Publicação do Setembro Amarelo sobre escuta e valorização da vida', 810, 1080, 'image/webp'),
            'social_resistencia' => $this->asset('social/instagram-resistencia.webp', 'Publicação sobre 14 anos de resistência à intolerância religiosa', 1080, 1080, 'image/webp'),
            'social_raizes' => $this->asset('social/instagram-raizes.webp', 'Publicação sobre a nova identidade do Hunkpame Azon Legidan', 864, 1080, 'image/webp'),
        ];

        $projects = [
            ['Lewa Orí', 'lewa-ori', 'Acolhimento, escuta qualificada e cuidado emocional como um direito para todas as pessoas.', null, 10, $assets['lewa']->id],
            ['Ayidonun', 'ayidonun', 'Alimento como sustento, memória, afeto, dignidade e fortalecimento comunitário.', null, 20, $assets['social_proposito']->id],
            ['Aman', 'aman', 'Valorização das folhas, dos saberes tradicionais e da relação ancestral com a natureza.', null, 30, $assets['aman']->id],
            ['Emi Syó', 'emi-syo', 'Mobilização, defesa de direitos e fortalecimento das vozes do nosso território.', null, 40, $assets['social_resistencia']->id],
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
            Project::query()->firstOrCreate(['slug' => $slug], [
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
            Post::query()->firstOrCreate(['slug' => $slug], [
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
                <<<'CAPTION'
O Projeto Lewa Ori – Saúde Mental, uma iniciativa do Instituto Azon Social, nasce com o propósito de promover acolhimento, escuta qualificada e cuidado emocional para pessoas que buscam fortalecer sua saúde mental e seu bem-estar. Contando com a colaboração voluntária da psicanalista Fabiana Drummond Calazans, o projeto realiza uma seleção remota para inserção dos participantes, ampliando o acesso ao atendimento de forma ética, sigilosa e humanizada. Acreditamos que cuidar da mente é um ato de valorização da vida, da autoestima e do autoconhecimento. Se você deseja iniciar uma jornada de fortalecimento emocional, participe desta iniciativa e descubra um espaço seguro para ser ouvido, acolhido e apoiado. Inscrições abertas.

Informações:
Instagram @azon.social,
e-mail instituto.azonsocial@gmail.com
WhatsApp (21) 96635-0373
CAPTION,
                'https://www.instagram.com/p/DZuiy3vRHXZ/',
                '2026-06-18 12:00:00',
                true,
                10,
                'social_lewa',
            ],
            [
                'Projeto Aman: mudas que preservam o axé',
                'instagram-projeto-aman-mudas',
                'Doação de mudas de dendezeiros para fortalecer terreiros e preservar folhas sagradas.',
                <<<'CAPTION'
Kwe Ceja Ayinon Jagum 🤝 Projeto Aman

É com muita alegria e axé que compartilhamos essa ação! A doação de mudas de Dendezeiros cultivadas no Kwe Ceja Ayinon Jagum para o Projeto Aman - Folhas de Axé. 🌿✨

Essas mudas serão destinadas a outros terreiros, fortalecendo a nossa rede, preservando nossas folhas sagradas e garantindo a continuidade das nossas tradições litúrgicas.

Este é mais um fruto do Azon Social, reafirmando o compromisso com a nossa ancestralidade, a sustentabilidade e a união entre as casas de santo.

Que o axé se multiplique e que os dendezeiros cresçam fortes em cada solo sagrado! 🦅💚
CAPTION,
                'https://www.instagram.com/p/DZNc3kZR1-G/',
                '2026-06-05 12:00:00',
                true,
                20,
                'social_aman',
            ],
            [
                'Há 9 anos, uma ação que virou propósito',
                'instagram-acao-que-virou-proposito',
                'Um registro de cuidado, partilha e responsabilidade coletiva que ajudou a formar o Azon Social.',
                <<<'CAPTION'
Há 9 anos, começávamos uma ação que sempre foi mais que uma campanha: durante o Candomblé de Avimaje, convidávamos as pessoas a trazerem mantimentos, agasalhos e doações para transformarmos em cestas básicas e ajudar quem mais precisava. Hoje, quinta-feira, meu TBT me lembrou desse registro de 9 anos atrás. Rever essas imagens me faz lembrar exatamente de onde vem nossa vontade de fazer, ajudar e transformar. O Azon Social nasceu desse instinto, desse fazer, dessa vontade de uma sociedade mais justa, solidária e harmoniosa. A nossa ancestralidade ensina que precisamos olhar um para o outro como comunidade, porque podemos viver bem nessa terra, mas, para isso, o outro também tem que estar bem. É esse axé de cuidado, partilha e responsabilidade coletiva que seguimos cultivando.

Dote Rodrigo
CAPTION,
                'https://www.instagram.com/p/DdGy-wJEVs_/',
                '2026-09-10 08:00:00',
                false,
                0,
                'social_proposito',
            ],
            [
                'Setembro Amarelo: existe escuta',
                'instagram-setembro-amarelo-existe-escuta',
                'O projeto Lewa Orí reforça que falar alivia, escutar transforma e acolher salva vidas.',
                <<<'CAPTION'
Setembro amarelo? Te que ser todos os meses, todos os dias!
O LewaOri está pra te escutar.

Fabiana Drummond
Azon Social - Projetos - LewaOri Saúde Mental
CAPTION,
                'https://www.instagram.com/p/DdCzC23uTIk/',
                '2026-09-09 12:00:00',
                false,
                0,
                'social_setembro',
            ],
            [
                '14 anos de resistência',
                'instagram-14-anos-de-resistencia',
                'Ancestralidade e ação no enfrentamento à intolerância e ao racismo religioso.',
                <<<'CAPTION'
Hoje, 7 de setembro, fazem 14 anos que entrei em uma delegacia para registrar uma queixa contra um pastor que, na época, invadia minhas terras, colocava fogo na minha mata e destruía assentamentos em minha roça. Foi naquele dia que descobri quem estava por trás da depredação do meu espaço.

Sou uma pessoa amistosa, pacata e boa praça. Mas fui agredido com palavras e chamado de “sujo” e “imundo” simplesmente por ser do Candomblé.

Aquilo não foi uma simples discussão. Foi intolerância religiosa. Foi violência contra minha fé e contra o meu direito de existir e cultuar aquilo que considero sagrado.

Nunca impus minha fé a ninguém. Apenas quero ter o direito de cultuar e servir aquilo em que acredito. E digo aos meus irmãos cristãos: não coloquem sobre a minha religião aquilo que pertence à crença de vocês. Eu não creio no diabo e não o cultuo.

DEUS É AMOR. DEUS É GRANDIOSO.

Aquela violência, a injustiça e a impunidade não terminaram em mim. Transformei a dor em ação. E foi dessa experiência que nasceu o Instituto Azon Social.

Hoje, o Instituto é realidade: uma resposta à intolerância, ao racismo religioso e às injustiças que ainda atingem tantas pessoas.

Não permitirei que uma cicatriz seja apenas uma lembrança. Ela será combustível para continuar lutando.

Em nome de Avimaje e Lissa, rogo por mais respeito, bom senso e sabedoria entre pessoas de todas as cores, culturas e credos.

E aqui, na minha roça, sob o comando de Azon Legidan, continuarei fazendo a minha parte.

Talvez eu seja apenas um grão de areia neste imenso oceano. Mas tenho certeza de uma coisa:

Minha passagem pela Terra não será em vão.

Que minha ancestralidade me fortaleça, minha fé me mantenha de pé e minhas ações abram caminhos para quem ainda sofre em silêncio.

Que Mawu nos permita sermos pessoas melhores do que fomos ontem.

Dote Rodrigo de Avimaje
CAPTION,
                'https://www.instagram.com/p/DdAT2JGNx8g/',
                '2026-09-08 12:00:00',
                false,
                0,
                'social_resistencia',
            ],
            [
                'Raízes que seguem vivas',
                'instagram-raizes-que-seguem-vivas',
                'Uma nova identidade para o Hunkpame Azon Legidan, preservando história, natureza e continuidade.',
                <<<'CAPTION'
🌿 Uma nova marca para um novo momento!
Após 12 anos de história, o Hunkpame Azon Legidan apresenta sua nova identidade visual.
Uma marca que nasce do respeito à nossa ancestralidade e traz, em seus símbolos, a força dos nossos patronos: Vodun Azonsu, senhor da cura, da terra e da renovação, e Vodun Dan, força da continuidade, da transformação e da eternidade.
A nova identidade representa um novo tempo, sem deixar para trás nossas raízes.
12 anos de história.
Uma nova marca.
A mesma essência. Um novo momento.

Hunkpame Azon Legidan
Dote Rodrigo de Avimaje
CAPTION,
                'https://www.instagram.com/p/Dc_D8keu35d/',
                '2026-09-07 12:00:00',
                false,
                0,
                'social_raizes',
            ],
        ];
        foreach ($socialPosts as [$title, $slug, $excerpt, $caption, $url, $publishedAt, $featured, $sortOrder, $cover]) {
            Post::query()->firstOrCreate(['slug' => $slug], [
                'type' => PostType::Social,
                'title' => $title,
                'excerpt' => $excerpt,
                'body' => $caption,
                'provider' => 'instagram',
                'external_url' => $url,
                'is_featured' => $featured,
                'sort_order' => $sortOrder,
                'cover_media_id' => $assets[$cover]->id,
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
            Event::query()->firstOrCreate(['slug' => $slug], [
                'title' => $title,
                'summary' => $summary,
                'body' => $summary,
                'location' => $location,
                'starts_at' => $startsAt,
                'date_label' => $dateLabel,
                'registration_url' => $registrationUrl,
                'participation_details' => $registrationUrl
                    ? 'Use o link de participação para fazer sua inscrição. Em caso de dúvida, fale com a equipe do Instituto Azon Social.'
                    : 'Entre em contato com a equipe do Instituto Azon Social para confirmar disponibilidade, orientações e formas de participação.',
                'status' => ContentStatus::Published,
                'published_at' => '2026-01-01 12:00:00',
                'cover_media_id' => $assets[$asset]->id,
            ]);
        }

        Page::query()->firstOrCreate(['slug' => 'inicio'], [
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
            'seo_title' => 'Instituto Azon Social | Projetos sociais em Sepetiba, RJ',
            'seo_description' => (string) config('site.description'),
        ]);

        foreach ([
            'site_name' => ['Instituto Azon Social', 'text', 'general'],
            'tagline' => ['Ancestralidade que cuida. Ação que transforma.', 'text', 'general'],
            'description' => [(string) config('site.description'), 'textarea', 'seo'],
            'email' => [(string) config('site.email'), 'email', 'contact'],
            'phone' => [(string) config('site.phone_display'), 'text', 'contact'],
            'address' => ['Rua Shalon, 46 — Sepetiba, Rio de Janeiro — RJ, CEP 23540-140', 'text', 'contact'],
            'hero_title' => ['Ancestralidade que cuida.', 'text', 'home'],
            'hero_emphasis' => ['Ação que transforma.', 'text', 'home'],
            'hero_text' => [(string) config('site.description'), 'textarea', 'home'],
            'founder_name' => ['Doté Rodrigo D’ Avimaje', 'text', 'home'],
            'founder_text' => ['Doté Rodrigo D’ Avimaje é o idealizador do Instituto Azon Social, atual presidente do Presente de Yamanjá de Sepetiba e sacerdote Jeje Mahi. Sua visão une ancestralidade, cuidado comunitário e transformação social.', 'textarea', 'home'],
        ] as $key => [$value, $type, $group]) {
            SiteSetting::query()->firstOrCreate(['key' => $key], compact('value', 'type', 'group'));
        }
    }

    private function asset(string $path, string $alt, int $width, int $height, string $mimeType = 'image/png'): MediaAsset
    {
        return MediaAsset::query()->firstOrCreate(
            ['path' => $path],
            ['disk' => 'site', 'original_name' => $path, 'mime_type' => $mimeType, 'size' => 0, 'alt_text' => $alt, 'width' => $width, 'height' => $height],
        );
    }
}

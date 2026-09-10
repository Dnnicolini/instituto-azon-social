import { Link, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { FieldError } from '@/components/admin/cms-ui';
import { AccessibilityTools } from '@/components/accessibility-tools';
import { SeoHead } from '@/components/seo-head';
import type { Event, Post, Project, SitePage, SiteSettings } from '@/types/cms';
import type { SeoData } from '@/types/seo';
type PublicDocument = {
    id: number;
    title: string;
    category?: string | null;
    file_url: string;
    published_at?: string | null;
};
type HomeProps = {
    seo: SeoData;
    page?: SitePage | null;
    settings?: Partial<SiteSettings>;
    posts?: Post[];
    socialPosts?: Post[];
    projects?: Project[];
    events?: Event[];
    documents?: PublicDocument[];
};

const instagramProfileUrl = 'https://www.instagram.com/azon.social/';

const projectBadges: Record<string, string> = {
    'lewa-ori': 'Saúde mental',
    ayidonun: 'Soberania alimentar',
    aman: 'Agroecologia & saberes',
    'emi-syo': 'Juventude & direitos',
    hunto: 'Mestres dos saberes',
    'ayi-gbe': 'Corpo & saúde integral',
};

type ValueIconName = 'ancestry' | 'care' | 'transformation';

function ValueIcon({ name }: { name: ValueIconName }) {
    if (name === 'ancestry') {
        return (
            <svg viewBox="0 0 48 48" aria-hidden="true">
                <path d="M24 41V24" />
                <path d="M24 27c-7 0-12-5-12-12 7 0 12 5 12 12Z" />
                <path d="M24 21c0-7 5-12 12-12 0 7-5 12-12 12Z" />
                <path d="M16 41h16" />
            </svg>
        );
    }

    if (name === 'care') {
        return (
            <svg viewBox="0 0 48 48" aria-hidden="true">
                <path d="M24 34 12.8 23.4a7 7 0 0 1 9.9-9.9L24 15l1.3-1.5a7 7 0 1 1 9.9 9.9L24 34Z" />
                <path d="M8 35c4.5 0 6.5 4 10 4h12c3.8 0 7-2.2 10-5" />
            </svg>
        );
    }

    return (
        <svg viewBox="0 0 48 48" aria-hidden="true">
            <path d="M8 36h32" />
            <path d="M13 31a12 12 0 0 1 22 0" />
            <path d="M24 8v6M11 14l4 4M37 14l-4 4" />
            <path d="m18 36 6-8 6 8" />
        </svg>
    );
}

function instagramEmbedUrl(value?: string | null): string | null {
    if (!value) return null;

    try {
        const url = new URL(value);
        if (!['instagram.com', 'www.instagram.com'].includes(url.hostname))
            return null;

        const match = url.pathname.match(/\/(p|reel)\/([A-Za-z0-9_-]+)/);
        return match
            ? `https://www.instagram.com/${match[1]}/${match[2]}/embed/captioned/`
            : null;
    } catch {
        return null;
    }
}

export default function Home({
    seo,
    page,
    settings = {},
    posts = [],
    socialPosts = [],
    projects = [],
    events = [],
    documents = [],
}: HomeProps) {
    const [menuOpen, setMenuOpen] = useState(false);
    const [newsFilter, setNewsFilter] = useState('Todos');
    const [selectedProject, setSelectedProject] = useState<Project | null>(
        null,
    );
    const [selectedSocialPost, setSelectedSocialPost] = useState<Post | null>(
        null,
    );
    const projectDialogRef = useRef<HTMLDialogElement>(null);
    const socialDialogRef = useRef<HTMLDialogElement>(null);
    const form = useForm({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
        website: '',
    });
    const sections = page?.sections ?? [];
    const section = (type: NonNullable<SitePage['sections']>[number]['type']) =>
        sections.find((item) => item.type === type);
    const hero = section('hero');
    const intro = section('intro');
    const history = section('history');
    const participate = section('participate');
    const transparency = section('transparency');
    const categories = useMemo(
        () => ['Todos', ...new Set(posts.map((post) => post.type))],
        [posts],
    );
    const filtered = useMemo(
        () =>
            newsFilter === 'Todos'
                ? posts
                : posts.filter((post) => post.type === newsFilter),
        [posts, newsFilter],
    );
    useEffect(() => {
        const dialog = projectDialogRef.current;
        if (!dialog) return;

        if (selectedProject && !dialog.open) dialog.showModal();
        if (!selectedProject && dialog.open) dialog.close();
    }, [selectedProject]);
    useEffect(() => {
        const dialog = socialDialogRef.current;
        if (!dialog) return;

        if (selectedSocialPost && !dialog.open) dialog.showModal();
        if (!selectedSocialPost && dialog.open) dialog.close();
    }, [selectedSocialPost]);
    function submit(e: FormEvent) {
        e.preventDefault();
        form.post('/contato', {
            preserveScroll: true,
            onSuccess: () => form.reset(),
        });
    }
    return (
        <>
            <SeoHead seo={seo} />
            <AccessibilityTools />
            <header className="site-header">
                <a
                    className="brand"
                    href="#inicio"
                    aria-label="Instituto Azon Social — início"
                >
                    <span className="brand-mark">
                        <img
                            src="/azon-social-logo.webp"
                            alt=""
                            width="721"
                            height="721"
                        />
                    </span>
                    <span>
                        <strong>Azon Social</strong>
                        <small>Instituto</small>
                    </span>
                </a>
                <button
                    className="menu-button"
                    type="button"
                    onClick={() => setMenuOpen((open) => !open)}
                    aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
                    aria-expanded={menuOpen}
                    aria-controls="main-navigation"
                >
                    <span />
                    <span />
                    <span />
                </button>
                <nav
                    id="main-navigation"
                    className={menuOpen ? 'nav open' : 'nav'}
                    aria-label="Navegação principal"
                >
                    <a href="#instituto" onClick={() => setMenuOpen(false)}>
                        O Instituto
                    </a>
                    <a href="#projetos" onClick={() => setMenuOpen(false)}>
                        Projetos
                    </a>
                    <a href="#noticias" onClick={() => setMenuOpen(false)}>
                        Notícias
                    </a>
                    <Link href="/eventos">Eventos</Link>
                    <Link href="/calendario">Calendário</Link>
                    <Link href="/midia">Mídia</Link>
                    {documents.length > 0 && (
                        <a
                            href="#transparencia"
                            onClick={() => setMenuOpen(false)}
                        >
                            Transparência
                        </a>
                    )}
                    <a
                        className="button button-small"
                        href="#participar"
                        onClick={() => setMenuOpen(false)}
                    >
                        Faça parte
                    </a>
                </nav>
            </header>
            <main id="conteudo-principal" tabIndex={-1}>
                <section className="hero" id="inicio">
                    <div className="hero-pattern" aria-hidden="true" />
                    <div className="hero-copy">
                        <p className="eyebrow light">
                            {hero?.eyebrow ??
                                'Educação • Cultura • Cuidado • Território'}
                        </p>
                        <h1>
                            {hero?.title ??
                                settings.hero_title ??
                                'Ancestralidade que cuida.'}
                            <br />
                            <em>
                                {hero?.emphasis ??
                                    settings.hero_emphasis ??
                                    'Ação que transforma.'}
                            </em>
                        </h1>
                        <p className="hero-text">
                            {hero?.text ??
                                settings.hero_text ??
                                'Ações sociais, culturais e ambientais que fortalecem pessoas, preservam saberes ancestrais e transformam territórios.'}
                        </p>
                        <div className="hero-actions">
                            <a
                                className="button button-gold"
                                href={hero?.cta_url ?? '#projetos'}
                            >
                                {hero?.cta_label ?? 'Conheça nossos projetos'}
                            </a>
                            <a className="text-link light" href="#participar">
                                Quero fazer parte <span>↗</span>
                            </a>
                        </div>
                    </div>
                    <div className="hero-visual">
                        <div className="sun" aria-hidden="true" />
                        <div className="logo-disc">
                            <img
                                src="/azon-social-logo.webp"
                                alt="Logomarca do Instituto Azon Social"
                                width="721"
                                height="721"
                                fetchPriority="high"
                            />
                        </div>
                        <p className="hero-note">Sepetiba • Rio de Janeiro</p>
                    </div>
                </section>
                <section className="intro section" id="instituto">
                    <div className="intro-heading">
                        <p className="eyebrow">
                            {intro?.eyebrow ?? 'Quem somos'}
                        </p>
                        <h2>
                            {intro?.title ??
                                'Cuidar das pessoas também é preservar nossas raízes.'}
                        </h2>
                    </div>
                    <div className="intro-copy">
                        <p>
                            {intro?.text ??
                                page?.body ??
                                'Nossa atuação une ancestralidade, cuidado, educação, cultura, defesa de direitos e preservação ambiental.'}
                        </p>
                        <a
                            className="text-link"
                            href={intro?.cta_url ?? '#historia'}
                        >
                            {intro?.cta_label ??
                                'Conheça nossa história completa'}{' '}
                            →
                        </a>
                    </div>
                    <div className="values-row">
                        <article className="value-card">
                            <div className="value-card-top">
                                <b>01</b>
                                <span>
                                    <ValueIcon name="ancestry" />
                                </span>
                            </div>
                            <h3>Ancestralidade</h3>
                            <p>
                                Saberes que atravessam gerações, mantendo viva a
                                memória de matriz africana e orientando caminhos
                                de dignidade para os que virão.
                            </p>
                            <small>Herança viva</small>
                        </article>
                        <article className="value-card">
                            <div className="value-card-top">
                                <b>02</b>
                                <span>
                                    <ValueIcon name="care" />
                                </span>
                            </div>
                            <h3>Cuidado Coletivo</h3>
                            <p>
                                Acolher, escutar e construir soluções junto à
                                comunidade. Saúde mental periférica e apoio
                                mútuo como pilares inegociáveis.
                            </p>
                            <small>Escuta qualificada</small>
                        </article>
                        <article className="value-card">
                            <div className="value-card-top">
                                <b>03</b>
                                <span>
                                    <ValueIcon name="transformation" />
                                </span>
                            </div>
                            <h3>Transformação Social</h3>
                            <p>
                                Defender a vida, a soberania alimentar e abrir
                                novos horizontes formativos e culturais para
                                jovens e famílias de Sepetiba.
                            </p>
                            <small>Autonomia e direitos</small>
                        </article>
                    </div>
                </section>
                <section className="projects section" id="projetos">
                    <div className="section-heading">
                        <div>
                            <p className="eyebrow">Nossas iniciativas</p>
                            <h2>Projetos que transformam</h2>
                        </div>
                        <p>
                            Cada projeto nasce de uma necessidade real e cresce
                            por meio da escuta, da participação e do compromisso
                            comunitário.
                        </p>
                    </div>
                    {projects.length ? (
                        <div className="project-grid">
                            {projects.map((project, index) => (
                                <article
                                    className={`project-card ${['blue', 'gold', 'green', 'brown'][index % 4]}`}
                                    key={project.id}
                                >
                                    <div className="card-top">
                                        <span>Projeto Azon</span>
                                        <b>
                                            {String(index + 1).padStart(2, '0')}
                                        </b>
                                    </div>
                                    <div className="project-art">
                                        {project.cover_url ? (
                                            <img
                                                src={project.cover_url}
                                                alt={project.cover_alt ?? ''}
                                                loading="lazy"
                                            />
                                        ) : (
                                            <div
                                                className="project-symbol"
                                                aria-hidden="true"
                                            >
                                                {project.title.charAt(0)}
                                            </div>
                                        )}
                                        <span className="project-badge">
                                            {projectBadges[project.slug] ??
                                                'Ação comunitária'}
                                        </span>
                                    </div>
                                    <h3>{project.title}</h3>
                                    <p>{project.summary}</p>
                                    <button
                                        className="project-card-action"
                                        type="button"
                                        onClick={() =>
                                            setSelectedProject(project)
                                        }
                                        aria-haspopup="dialog"
                                        aria-label={`Conhecer projeto ${project.title}`}
                                    >
                                        Conhecer projeto <span>↗</span>
                                    </button>
                                </article>
                            ))}
                        </div>
                    ) : (
                        <div className="public-empty">
                            <h3>Projetos em preparação</h3>
                            <p>
                                As iniciativas publicadas pela equipe aparecerão
                                aqui.
                            </p>
                        </div>
                    )}
                </section>
                <dialog
                    className="social-dialog project-dialog"
                    ref={projectDialogRef}
                    aria-labelledby="project-preview-title"
                    onClose={() => setSelectedProject(null)}
                    onClick={(event) => {
                        if (event.target === event.currentTarget)
                            setSelectedProject(null);
                    }}
                >
                    {selectedProject && (
                        <div className="social-dialog-inner">
                            <button
                                className="social-dialog-close"
                                type="button"
                                aria-label="Fechar projeto"
                                onClick={() => setSelectedProject(null)}
                                autoFocus
                            >
                                ×
                            </button>
                            <div className="social-dialog-media project-dialog-media">
                                {selectedProject.cover_url ? (
                                    <img
                                        src={selectedProject.cover_url}
                                        alt={selectedProject.cover_alt ?? ''}
                                    />
                                ) : (
                                    <div
                                        className="project-dialog-letter"
                                        aria-hidden="true"
                                    >
                                        {selectedProject.title.charAt(0)}
                                    </div>
                                )}
                            </div>
                            <div className="social-dialog-copy project-dialog-copy">
                                <p className="eyebrow">Projeto Azon</p>
                                <h2 id="project-preview-title">
                                    {selectedProject.title}
                                </h2>
                                <p>{selectedProject.body}</p>
                                <a
                                    className="button button-gold"
                                    href="#contato"
                                    onClick={() => setSelectedProject(null)}
                                >
                                    Quero saber mais
                                </a>
                            </div>
                        </div>
                    )}
                </dialog>
                <section className="news section" id="noticias">
                    <div className="section-heading compact">
                        <div>
                            <p className="eyebrow">Azon em movimento</p>
                            <h2>Histórias do nosso território</h2>
                        </div>
                        <p>
                            Artigos, vídeos e conversas produzidos pelo
                            Instituto.
                        </p>
                    </div>
                    {posts.length ? (
                        <>
                            <div
                                className="filters"
                                role="group"
                                aria-label="Filtrar conteúdos"
                            >
                                {categories.map((filter) => (
                                    <button
                                        className={
                                            newsFilter === filter
                                                ? 'active'
                                                : ''
                                        }
                                        type="button"
                                        aria-pressed={newsFilter === filter}
                                        onClick={() => setNewsFilter(filter)}
                                        key={filter}
                                    >
                                        {filter === 'Todos'
                                            ? 'Todos'
                                            : filter === 'article'
                                              ? 'Artigos'
                                              : filter}
                                    </button>
                                ))}
                            </div>
                            <div className="news-grid">
                                {filtered.slice(0, 6).map((post, index) => (
                                    <article
                                        className="news-card"
                                        key={post.id}
                                    >
                                        {post.cover_url ? (
                                            <img
                                                className="news-cover"
                                                src={post.cover_url}
                                                alt={post.cover_alt ?? ''}
                                                loading="lazy"
                                            />
                                        ) : (
                                            <div
                                                className={`news-art ${['blue', 'gold', 'green'][index % 3]}`}
                                            >
                                                <span>{post.type}</span>
                                            </div>
                                        )}
                                        <div className="news-body">
                                            <small>
                                                {post.published_at
                                                    ? new Date(
                                                          post.published_at,
                                                      ).toLocaleDateString(
                                                          'pt-BR',
                                                      )
                                                    : 'Em destaque'}
                                            </small>
                                            <h3>{post.title}</h3>
                                            <p>{post.excerpt}</p>
                                            <Link
                                                href={
                                                    post.type === 'article'
                                                        ? `/noticias/${post.slug}`
                                                        : `/midia/${post.slug}`
                                                }
                                            >
                                                Continuar lendo →
                                            </Link>
                                        </div>
                                    </article>
                                ))}
                            </div>
                            <Link
                                className="text-link home-media-link"
                                href="/midia"
                            >
                                Ver vlogs, vídeos e podcasts →
                            </Link>
                        </>
                    ) : (
                        <div className="public-empty">
                            <h3>Novas histórias em preparação</h3>
                            <p>
                                Os próximos registros do Instituto serão
                                publicados aqui.
                            </p>
                        </div>
                    )}
                </section>
                <section className="social-section section" id="redes-sociais">
                    <div className="social-heading">
                        <div>
                            <p className="eyebrow">Redes sociais</p>
                            <h2>Acompanhe nossas redes sociais</h2>
                        </div>
                        <div className="social-heading-copy">
                            <p>
                                Bastidores, encontros e ações do Instituto Azon
                                Social.
                            </p>
                            <a
                                className="text-link"
                                href={instagramProfileUrl}
                                target="_blank"
                                rel="noreferrer"
                            >
                                @azon.social — ver perfil ↗
                            </a>
                        </div>
                    </div>
                    {socialPosts.length ? (
                        <div className="social-grid">
                            {socialPosts.map((post, index) => (
                                <article className="social-card" key={post.id}>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setSelectedSocialPost(post)
                                        }
                                        aria-haspopup="dialog"
                                        aria-label={`Abrir prévia: ${post.title}`}
                                    >
                                        <span className="social-card-media">
                                            {post.cover_url ? (
                                                <img
                                                    src={post.cover_url}
                                                    alt={post.cover_alt ?? ''}
                                                    loading="lazy"
                                                />
                                            ) : (
                                                <span
                                                    className={`social-card-placeholder tone-${index % 4}`}
                                                    aria-hidden="true"
                                                >
                                                    <img
                                                        src="/azon-social-logo.webp"
                                                        alt=""
                                                        width="721"
                                                        height="721"
                                                        loading="lazy"
                                                    />
                                                </span>
                                            )}
                                            {post.is_featured && (
                                                <span className="social-featured">
                                                    Destaque
                                                </span>
                                            )}
                                        </span>
                                        <span className="social-card-copy">
                                            <small>
                                                {post.published_at
                                                    ? new Date(
                                                          post.published_at,
                                                      ).toLocaleDateString(
                                                          'pt-BR',
                                                      )
                                                    : 'Publicação'}
                                            </small>
                                            <strong>{post.title}</strong>
                                            <span>{post.excerpt}</span>
                                            <b>
                                                Ver prévia <i>↗</i>
                                            </b>
                                        </span>
                                    </button>
                                </article>
                            ))}
                        </div>
                    ) : (
                        <div className="public-empty">
                            <h3>Novas publicações em preparação</h3>
                            <p>
                                Os registros publicados pela equipe aparecerão
                                aqui.
                            </p>
                        </div>
                    )}
                </section>
                <section className="agenda section" id="agenda">
                    <div>
                        <p className="eyebrow">Eventos e inscrições</p>
                        <h2>Participe das nossas ações</h2>
                    </div>
                    <div className="agenda-empty">
                        <span className="calendar-icon" aria-hidden="true">
                            {events.length}
                        </span>
                        <div>
                            <h3>
                                {events.length
                                    ? `${events.length} oportunidade(s) na agenda.`
                                    : 'A agenda está sendo preparada.'}
                            </h3>
                            <p>
                                Veja oportunidades abertas, próximos eventos e a
                                memória das ações realizadas.
                            </p>
                        </div>
                        <Link className="button button-outline" href="/eventos">
                            Ver todos os eventos →
                        </Link>
                    </div>
                </section>
                <dialog
                    className="social-dialog"
                    ref={socialDialogRef}
                    aria-labelledby="social-preview-title"
                    onClose={() => setSelectedSocialPost(null)}
                    onClick={(event) => {
                        if (event.target === event.currentTarget)
                            setSelectedSocialPost(null);
                    }}
                >
                    {selectedSocialPost && (
                        <div className="social-dialog-inner">
                            <button
                                className="social-dialog-close"
                                type="button"
                                aria-label="Fechar prévia"
                                onClick={() => setSelectedSocialPost(null)}
                                autoFocus
                            >
                                ×
                            </button>
                            <div className="social-dialog-media">
                                {selectedSocialPost.cover_url ? (
                                    <img
                                        src={selectedSocialPost.cover_url}
                                        alt={selectedSocialPost.cover_alt ?? ''}
                                    />
                                ) : instagramEmbedUrl(
                                      selectedSocialPost.external_url,
                                  ) ? (
                                    <iframe
                                        src={
                                            instagramEmbedUrl(
                                                selectedSocialPost.external_url,
                                            ) ?? undefined
                                        }
                                        title={`Publicação no Instagram: ${selectedSocialPost.title}`}
                                        loading="lazy"
                                        allow="encrypted-media; picture-in-picture"
                                        referrerPolicy="strict-origin-when-cross-origin"
                                    />
                                ) : (
                                    <div className="social-dialog-placeholder">
                                        <img
                                            src="/azon-social-logo.webp"
                                            alt=""
                                            width="721"
                                            height="721"
                                        />
                                    </div>
                                )}
                            </div>
                            <div className="social-dialog-copy">
                                <p className="eyebrow">@azon.social</p>
                                <small>
                                    {selectedSocialPost.published_at
                                        ? new Date(
                                              selectedSocialPost.published_at,
                                          ).toLocaleDateString('pt-BR')
                                        : 'Publicação do Instituto'}
                                </small>
                                <h2 id="social-preview-title">
                                    {selectedSocialPost.title}
                                </h2>
                                <p className="social-dialog-caption">
                                    {selectedSocialPost.body ??
                                        selectedSocialPost.excerpt}
                                </p>
                                {selectedSocialPost.external_url && (
                                    <a
                                        className="button button-gold"
                                        href={selectedSocialPost.external_url}
                                        target="_blank"
                                        rel="noreferrer"
                                    >
                                        Ver no Instagram ↗
                                    </a>
                                )}
                            </div>
                        </div>
                    )}
                </dialog>
                <section className="history" id="historia">
                    <div className="history-mark" aria-hidden="true">
                        A
                    </div>
                    <div>
                        <p className="eyebrow light">
                            {history?.eyebrow ?? 'De onde viemos'}
                        </p>
                        <h2>
                            {history?.title ??
                                'Uma história que nasce no território e na ancestralidade.'}
                        </h2>
                    </div>
                    <div>
                        <p>
                            {history?.text ??
                                'O Instituto Azon Social nasce no Hunkpame Azon Legidan, espaço de tradição, fé, preservação cultural e cuidado comunitário.'}
                        </p>
                        {history?.cta_url && (
                            <a
                                className="text-link light"
                                href={history.cta_url}
                            >
                                {history.cta_label ?? 'Conheça nossa história'}{' '}
                                →
                            </a>
                        )}
                    </div>
                </section>
                <section className="participate section" id="participar">
                    <div className="section-heading">
                        <div>
                            <p className="eyebrow">
                                {participate?.eyebrow ?? 'Caminhe com a gente'}
                            </p>
                            <h2>
                                {participate?.title ??
                                    'Existem muitas formas de transformar.'}
                            </h2>
                        </div>
                        <p>
                            {participate?.text ??
                                'Some sua presença, experiência ou apoio à construção de um território mais justo e acolhedor.'}
                        </p>
                    </div>
                    <div className="participate-grid">
                        {[
                            [
                                '01',
                                'Seja voluntário',
                                'Compartilhe seu tempo, escuta e conhecimento profissional com nossos projetos comunitários em Sepetiba.',
                            ],
                            [
                                '02',
                                'Seja parceiro',
                                'Construa ações, editais, programas formativos e oportunidades estratégicas em parceria com o Instituto.',
                            ],
                            [
                                '03',
                                'Apoie nossas ações',
                                'Contribua para a sustentabilidade e continuidade das iniciativas sociais e oficinas formativas.',
                            ],
                        ].map(([n, t, d], index) => (
                            <a
                                className={
                                    index === 2 ? 'participate-featured' : ''
                                }
                                href="#contato"
                                key={t}
                            >
                                <span className="participate-number">{n}</span>
                                <h3>{t}</h3>
                                <p>{d}</p>
                                <b>
                                    {index === 2
                                        ? 'Doar agora / Apoiar →'
                                        : 'Quero participar ↗'}
                                </b>
                            </a>
                        ))}
                    </div>
                </section>
                {documents.length > 0 && (
                    <section
                        className="transparency section"
                        id="transparencia"
                    >
                        <div className="transparency-copy">
                            <p className="eyebrow">
                                {transparency?.eyebrow ?? 'Compromisso público'}
                            </p>
                            <h2>
                                {transparency?.title ??
                                    'Transparência fortalece confiança.'}
                            </h2>
                            <p>
                                {transparency?.text ??
                                    'Este espaço reúne relatórios, políticas e prestação de contas do Instituto.'}
                            </p>
                        </div>
                        <div className="document-list">
                            {documents.map((document) => (
                                <article key={document.id}>
                                    <span aria-hidden="true">▤</span>
                                    <div>
                                        <h3>{document.title}</h3>
                                        <p>
                                            {document.category ??
                                                'Documento institucional para consulta pública.'}
                                        </p>
                                        <a
                                            href={document.file_url}
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            Consultar documento ↗
                                        </a>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </section>
                )}
                <section className="contact section" id="contato">
                    <div className="contact-copy">
                        <p className="eyebrow light">Entre em contato</p>
                        <h2>Vamos construir juntos?</h2>
                        <p>
                            Envie sua mensagem para saber mais sobre projetos,
                            parcerias, voluntariado e formas de apoio.
                        </p>
                        <div className="contact-details">
                            <div>
                                <span aria-hidden="true">☎</span>
                                <p>
                                    <small>Telefone / WhatsApp</small>
                                    <a
                                        href={`tel:${settings.phone ?? '+5521951015058'}`}
                                    >
                                        {settings.phone ?? '(21) 95101-5058'}
                                    </a>
                                </p>
                            </div>
                            <div>
                                <span aria-hidden="true">✉</span>
                                <p>
                                    <small>E-mail institucional</small>
                                    <a
                                        href={`mailto:${settings.email ?? 'instituto.azonsocial@gmail.com'}`}
                                    >
                                        {settings.email ??
                                            'instituto.azonsocial@gmail.com'}
                                    </a>
                                </p>
                            </div>
                            <div>
                                <span aria-hidden="true">⌖</span>
                                <p>
                                    <small>Território de atuação</small>
                                    <strong>
                                        {settings.address ??
                                            'Rua Shalon, 46 — Sepetiba, Rio de Janeiro — RJ, CEP 23540-140'}
                                    </strong>
                                </p>
                            </div>
                        </div>
                        <div className="territory-map">
                            <iframe
                                title="Mapa do Hunkpame Azon Legidan"
                                src="https://www.google.com/maps?q=Rua%20Shalon%2C%2046%2C%20Sepetiba%2C%20Rio%20de%20Janeiro%20-%20RJ%2C%2023540-140&output=embed"
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                            />
                            <a
                                href="https://www.google.com/maps/search/?api=1&query=Rua%20Shalon%2C%2046%2C%20Sepetiba%2C%20Rio%20de%20Janeiro%20-%20RJ%2C%2023540-140"
                                target="_blank"
                                rel="noreferrer"
                            >
                                Hunkpame Azon Legidan — abrir no mapa ↗
                            </a>
                        </div>
                    </div>
                    <form className="contact-form" onSubmit={submit} noValidate>
                        <label>
                            Nome
                            <input
                                placeholder="Como podemos te chamar?"
                                value={form.data.name}
                                onChange={(e) =>
                                    form.setData('name', e.target.value)
                                }
                                autoComplete="name"
                            />
                            <FieldError message={form.errors.name} />
                        </label>
                        <label>
                            E-mail
                            <input
                                type="email"
                                placeholder="seuemail@exemplo.com"
                                value={form.data.email}
                                onChange={(e) =>
                                    form.setData('email', e.target.value)
                                }
                                autoComplete="email"
                            />
                            <FieldError message={form.errors.email} />
                        </label>
                        <label>
                            Telefone (opcional)
                            <input
                                placeholder="(21) 90000-0000"
                                value={form.data.phone}
                                onChange={(e) =>
                                    form.setData('phone', e.target.value)
                                }
                                autoComplete="tel"
                            />
                            <FieldError message={form.errors.phone} />
                        </label>
                        <label>
                            Assunto
                            <select
                                value={form.data.subject}
                                onChange={(e) =>
                                    form.setData('subject', e.target.value)
                                }
                            >
                                <option value="">Selecione</option>
                                <option>Informações</option>
                                <option>Voluntariado</option>
                                <option>Parceria</option>
                                <option>Doação</option>
                                <option>Imprensa</option>
                            </select>
                        </label>
                        <label className="contact-message-field">
                            Mensagem
                            <textarea
                                rows={5}
                                placeholder="Conte um pouco sobre você, sua ideia ou como deseja apoiar..."
                                value={form.data.message}
                                onChange={(e) =>
                                    form.setData('message', e.target.value)
                                }
                            />
                            <FieldError message={form.errors.message} />
                        </label>
                        <label className="honeypot" aria-hidden="true">
                            Não preencha
                            <input
                                tabIndex={-1}
                                autoComplete="off"
                                value={form.data.website}
                                onChange={(e) =>
                                    form.setData('website', e.target.value)
                                }
                            />
                        </label>
                        <button
                            className="button button-gold"
                            type="submit"
                            disabled={form.processing}
                        >
                            {form.processing ? 'Enviando…' : 'Enviar mensagem'}
                        </button>
                        {form.recentlySuccessful && (
                            <p className="form-note" role="status">
                                Mensagem enviada. A equipe entrará em contato.
                            </p>
                        )}
                    </form>
                </section>
                <section className="founder section" id="idealizador">
                    <figure className="founder-portrait">
                        <img
                            src="/dote-rodrigo.webp"
                            alt="Doté Rodrigo D’ Avimaje"
                            width="1254"
                            height="1254"
                            loading="lazy"
                        />
                    </figure>
                    <div className="founder-heading">
                        <p className="eyebrow">Idealizador</p>
                        <h2>
                            {settings.founder_name ?? 'Doté Rodrigo D’ Avimaje'}
                        </h2>
                    </div>
                    <div className="founder-copy">
                        <p>
                            {settings.founder_text ??
                                'Doté Rodrigo D’ Avimaje é o idealizador do Instituto Azon Social, atual presidente do Presente de Yamanjá de Sepetiba e sacerdote Jeje Mahi. Sua visão une ancestralidade, cuidado comunitário e transformação social.'}
                        </p>
                        <span>Sacerdote Jeje Mahi • Liderança comunitária</span>
                    </div>
                </section>
            </main>
            <footer>
                <div className="footer-brand">
                    <span className="brand-mark">
                        <img
                            src="/azon-social-logo.webp"
                            alt=""
                            width="721"
                            height="721"
                            loading="lazy"
                        />
                    </span>
                    <div>
                        <strong>Azon Social</strong>
                        <p>
                            {settings.tagline ??
                                'Ancestralidade, cuidado e transformação social.'}
                        </p>
                    </div>
                </div>
                <div>
                    <strong>Navegue</strong>
                    <a href="#instituto">O Instituto</a>
                    <a href="#projetos">Projetos</a>
                    <a href="#idealizador">Idealizador</a>
                    <Link href="/midia">Mídia</Link>
                    <Link href="/eventos">Eventos</Link>
                    <Link href="/calendario">Calendário</Link>
                </div>
                <div>
                    <strong>Contato</strong>
                    <a
                        href={`mailto:${settings.email ?? 'instituto.azonsocial@gmail.com'}`}
                    >
                        {settings.email ?? 'instituto.azonsocial@gmail.com'}
                    </a>
                    <a
                        href="https://www.instagram.com/azon.social/"
                        target="_blank"
                        rel="noreferrer"
                    >
                        @azon.social ↗
                    </a>
                </div>
                <p className="copyright">
                    © {new Date().getFullYear()} Instituto Azon Social
                </p>
            </footer>
        </>
    );
}

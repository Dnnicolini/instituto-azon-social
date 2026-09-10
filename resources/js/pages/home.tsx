import { Link, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { useMemo, useState } from 'react';
import { FieldError } from '@/components/admin/cms-ui';
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
    projects?: Project[];
    events?: Event[];
    documents?: PublicDocument[];
};
export default function Home({
    seo,
    page,
    settings = {},
    posts = [],
    projects = [],
    events = [],
    documents = [],
}: HomeProps) {
    const [menuOpen, setMenuOpen] = useState(false);
    const [newsFilter, setNewsFilter] = useState('Todos');
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
            <main>
                <header className="site-header">
                    <a
                        className="brand"
                        href="#inicio"
                        aria-label="Instituto Azon Social — início"
                    >
                        <span className="brand-mark">
                            <img
                                src="/azon-social-logo.png"
                                alt=""
                                width="860"
                                height="846"
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
                        <Link href="/midia">Mídia</Link>
                        <a
                            href="#transparencia"
                            onClick={() => setMenuOpen(false)}
                        >
                            Transparência
                        </a>
                        <a
                            className="button button-small"
                            href="#participar"
                            onClick={() => setMenuOpen(false)}
                        >
                            Faça parte
                        </a>
                    </nav>
                </header>
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
                                src="/azon-social-logo.png"
                                alt="Logomarca do Instituto Azon Social"
                                width="860"
                                height="846"
                                fetchPriority="high"
                            />
                        </div>
                        <p className="hero-note">
                            {settings.address ?? 'Sepetiba • Rio de Janeiro'}
                        </p>
                    </div>
                </section>
                <section className="intro section" id="instituto">
                    <div>
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
                            {intro?.cta_label ?? 'Conheça nossa história'} →
                        </a>
                    </div>
                    <div className="values-row">
                        <article>
                            <b>01</b>
                            <h3>Ancestralidade</h3>
                            <p>
                                Saberes que atravessam gerações e orientam nosso
                                caminho.
                            </p>
                        </article>
                        <article>
                            <b>02</b>
                            <h3>Cuidado coletivo</h3>
                            <p>
                                Acolher, escutar e construir soluções junto à
                                comunidade.
                            </p>
                        </article>
                        <article>
                            <b>03</b>
                            <h3>Transformação social</h3>
                            <p>
                                Defender a vida, a dignidade e novas
                                possibilidades no território.
                            </p>
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
                                    <div
                                        className="project-symbol"
                                        aria-hidden="true"
                                    >
                                        {project.title.charAt(0)}
                                    </div>
                                    <h3>{project.title}</h3>
                                    <p>{project.summary}</p>
                                    <a href="#contato">
                                        Conhecer projeto <span>↗</span>
                                    </a>
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
                                'Compartilhe seu tempo e conhecimento com nossos projetos.',
                            ],
                            [
                                '02',
                                'Seja parceiro',
                                'Construa ações e oportunidades em parceria com o Instituto.',
                            ],
                            [
                                '03',
                                'Apoie nossas ações',
                                'Contribua para a continuidade das iniciativas sociais.',
                            ],
                        ].map(([n, t, d]) => (
                            <a href="#contato" key={t}>
                                <span>{n}</span>
                                <h3>{t}</h3>
                                <p>{d}</p>
                                <b>Quero participar ↗</b>
                            </a>
                        ))}
                    </div>
                </section>
                <section className="transparency section" id="transparencia">
                    <div>
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
                    {documents.length ? (
                        <div className="document-list">
                            {documents.map((document) => (
                                <div key={document.id}>
                                    <a
                                        href={document.file_url}
                                        target="_blank"
                                        rel="noreferrer"
                                    >
                                        {document.title} ↗
                                    </a>
                                    <small>
                                        {document.category ??
                                            'Documento público'}
                                    </small>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="public-empty">
                            <h3>Documentos em preparação</h3>
                            <p>
                                Relatórios e políticas publicados pela equipe
                                aparecerão aqui.
                            </p>
                        </div>
                    )}
                </section>
                <section className="contact section" id="contato">
                    <div className="contact-copy">
                        <p className="eyebrow light">Entre em contato</p>
                        <h2>Vamos construir juntos?</h2>
                        <p>
                            Envie sua mensagem para saber mais sobre projetos,
                            parcerias, voluntariado e formas de apoio.
                        </p>
                        <div className="contact-details">
                            <a
                                href={`tel:${settings.phone ?? '+5521951015058'}`}
                            >
                                {settings.phone ?? '(21) 95101-5058'}
                            </a>
                            <a
                                href={`mailto:${settings.email ?? 'instituto.azonsocial@gmail.com'}`}
                            >
                                {settings.email ??
                                    'instituto.azonsocial@gmail.com'}
                            </a>
                        </div>
                        <p className="location">
                            {settings.address ??
                                'Sepetiba • Rio de Janeiro — RJ'}
                        </p>
                    </div>
                    <form onSubmit={submit} noValidate>
                        <label>
                            Nome
                            <input
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
                <footer>
                    <div className="footer-brand">
                        <span className="brand-mark">
                            <img
                                src="/azon-social-logo.png"
                                alt=""
                                width="860"
                                height="846"
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
                        <Link href="/midia">Mídia</Link>
                        <Link href="/eventos">Eventos</Link>
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
            </main>
        </>
    );
}

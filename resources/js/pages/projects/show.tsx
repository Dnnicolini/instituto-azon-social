import { Link } from '@inertiajs/react';
import { AccessibilityTools } from '@/components/accessibility-tools';
import { RegistrationStatus } from '@/components/applications/registration-status';
import { PublicSeoHead } from '@/components/applications/public-seo-head';
import { ContentGallery } from '@/components/content-gallery';
import { PublicFooter, PublicHeader } from '@/components/public-site-chrome';
import { contentUrl } from '@/lib/content-url';
import { formatApplicationDate } from '@/lib/applications';
import type { ProjectShowProps } from '@/types/applications';

export default function ProjectShow({
    seo,
    project,
    registration,
    related_posts: relatedPosts = [],
    related_events: relatedEvents = [],
}: ProjectShowProps) {
    const paragraphs = (project.body ?? '').split(/\n{2,}/).filter(Boolean);
    const posts = relatedPosts.length
        ? relatedPosts
        : (project.related_posts ?? []);
    const events = relatedEvents.length
        ? relatedEvents
        : (project.related_events ?? []);

    return (
        <>
            <PublicSeoHead
                seo={seo}
                fallbackTitle={project.title}
                fallbackDescription={project.summary}
            />
            <AccessibilityTools />
            <PublicHeader />
            <main
                className="project-detail-page"
                id="conteudo-principal"
                tabIndex={-1}
            >
                <header className="project-detail-hero">
                    <div className="project-detail-copy">
                        <Link className="text-link light" href="/#projetos">
                            ← Voltar aos projetos
                        </Link>
                        <p className="eyebrow light">
                            {project.badge_label || 'Projeto Azon Social'}
                        </p>
                        <h1>{project.title}</h1>
                        <p>{project.summary}</p>
                    </div>
                    <div className="project-detail-art">
                        {project.cover_url ? (
                            <img
                                src={project.cover_url}
                                alt={project.cover_alt ?? ''}
                            />
                        ) : (
                            <span aria-hidden="true">
                                {project.title.charAt(0)}
                            </span>
                        )}
                    </div>
                </header>

                <div className="project-detail-layout">
                    <article className="project-detail-body">
                        <h2>Sobre o projeto</h2>
                        {paragraphs.length ? (
                            paragraphs.map((paragraph) => (
                                <p key={paragraph.slice(0, 80)}>{paragraph}</p>
                            ))
                        ) : (
                            <p>{project.summary}</p>
                        )}
                    </article>

                    {registration?.enabled && (
                        <aside className="project-registration-panel">
                            <h2>
                                {registration.title ?? 'Participe do projeto'}
                            </h2>
                            {registration.description && (
                                <p>{registration.description}</p>
                            )}
                            <RegistrationStatus
                                projectSlug={project.slug}
                                registration={registration}
                            />
                        </aside>
                    )}
                </div>

                {(project.gallery_images?.length ?? 0) > 0 && (
                    <ContentGallery
                        items={project.gallery_images ?? []}
                        title="Registros do projeto"
                        description="Imagens e vídeos das ações realizadas junto à comunidade."
                        fallbackAlt={`Registro do projeto ${project.title}`}
                    />
                )}

                {posts.length > 0 && (
                    <section
                        className="project-related-posts"
                        aria-labelledby="project-posts-title"
                    >
                        <header>
                            <h2 id="project-posts-title">
                                Histórias e publicações
                            </h2>
                            <p>
                                Acompanhe notícias e registros produzidos a
                                partir deste projeto.
                            </p>
                        </header>
                        <div>
                            {posts.map((post) => (
                                <article key={post.id}>
                                    <Link href={contentUrl(post)}>
                                        {post.cover_url ? (
                                            <img
                                                src={post.cover_url}
                                                alt={post.cover_alt ?? ''}
                                                loading="lazy"
                                            />
                                        ) : (
                                            <span aria-hidden="true">
                                                {post.title.charAt(0)}
                                            </span>
                                        )}
                                    </Link>
                                    <small>
                                        {post.published_at
                                            ? formatApplicationDate(
                                                  post.published_at,
                                              )
                                            : 'Publicação Azon'}
                                    </small>
                                    <h3>
                                        <Link href={contentUrl(post)}>
                                            {post.title}
                                        </Link>
                                    </h3>
                                    {post.excerpt && <p>{post.excerpt}</p>}
                                </article>
                            ))}
                        </div>
                    </section>
                )}

                {events.length > 0 && (
                    <section
                        className="project-event-history"
                        aria-labelledby="project-events-title"
                    >
                        <header>
                            <h2 id="project-events-title">
                                Histórico de eventos
                            </h2>
                            <p>
                                Encontros e atividades vinculados a esta
                                iniciativa.
                            </p>
                        </header>
                        <ol>
                            {events.map((event) => (
                                <li key={event.id}>
                                    <time
                                        dateTime={event.starts_at ?? undefined}
                                    >
                                        {event.date_label ??
                                            formatApplicationDate(
                                                event.starts_at,
                                            )}
                                    </time>
                                    <div>
                                        <h3>{event.title}</h3>
                                        <p>{event.summary}</p>
                                        <span>{event.location}</span>
                                    </div>
                                    <Link
                                        href={`/calendario/eventos/${event.slug}`}
                                    >
                                        Ver evento →
                                    </Link>
                                </li>
                            ))}
                        </ol>
                    </section>
                )}
            </main>
            <PublicFooter />
        </>
    );
}

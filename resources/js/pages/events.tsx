import { Link } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { Pagination } from '@/components/admin/cms-ui';
import { AccessibilityTools } from '@/components/accessibility-tools';
import { PublicFooter, PublicHeader } from '@/components/public-site-chrome';
import { SeoHead } from '@/components/seo-head';
import type { Event, Paginated } from '@/types/cms';
import type { SeoData } from '@/types/seo';

type Filter = 'Todos' | 'Inscrições abertas' | 'Próximos' | 'Realizados';
function eventGroup(event: Event): Exclude<Filter, 'Todos'> {
    if (event.registration_url && !event.starts_at) return 'Inscrições abertas';
    if (!event.starts_at) return 'Próximos';
    return new Date(event.ends_at ?? event.starts_at).getTime() < Date.now()
        ? 'Realizados'
        : 'Próximos';
}
export default function EventsPage({
    seo,
    events,
}: {
    seo: SeoData;
    events: Paginated<Event>;
}) {
    const [filter, setFilter] = useState<Filter>('Todos');
    const filtered = useMemo(
        () =>
            filter === 'Todos'
                ? events.data
                : events.data.filter((event) => eventGroup(event) === filter),
        [events.data, filter],
    );
    return (
        <>
            <SeoHead seo={seo} />
            <AccessibilityTools />
            <PublicHeader />
            <main className="events-page" id="conteudo-principal" tabIndex={-1}>
                <section className="events-hero">
                    <div>
                        <p className="eyebrow light">Agenda Azon Social</p>
                        <h1>
                            Encontros que fortalecem <em>nossa comunidade.</em>
                        </h1>
                    </div>
                    <p>
                        Confira inscrições abertas, atividades, celebrações e
                        ações construídas pelo Instituto Azon Social.
                    </p>
                </section>
                <section className="events-content">
                    <div className="events-toolbar">
                        <div>
                            <p className="eyebrow">Participe</p>
                            <h2>Eventos e oportunidades</h2>
                        </div>
                        <div
                            className="filters"
                            role="group"
                            aria-label="Filtrar eventos desta página"
                        >
                            {(
                                [
                                    'Todos',
                                    'Inscrições abertas',
                                    'Próximos',
                                    'Realizados',
                                ] as Filter[]
                            ).map((item) => (
                                <button
                                    key={item}
                                    className={filter === item ? 'active' : ''}
                                    type="button"
                                    aria-pressed={filter === item}
                                    onClick={() => setFilter(item)}
                                >
                                    {item}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="event-list">
                        {filtered.length ? (
                            filtered.map((event) => (
                                <article
                                    className="event-card"
                                    id={event.slug}
                                    key={event.id}
                                >
                                    <div className="event-image">
                                        {event.cover_url ? (
                                            <img
                                                src={event.cover_url}
                                                alt={
                                                    event.cover_alt ??
                                                    event.title
                                                }
                                                loading="lazy"
                                            />
                                        ) : (
                                            <div
                                                className="event-image-fallback"
                                                aria-hidden="true"
                                            >
                                                A
                                            </div>
                                        )}
                                        <span className="event-badge">
                                            {event.date_label ??
                                                eventGroup(event)}
                                        </span>
                                    </div>
                                    <div className="event-info">
                                        <div className="event-meta">
                                            <span>Ação Azon</span>
                                            <b>{eventGroup(event)}</b>
                                        </div>
                                        <h3>{event.title}</h3>
                                        <p>{event.summary}</p>
                                        <dl>
                                            <div>
                                                <dt>Data</dt>
                                                <dd>
                                                    {event.date_label ??
                                                        (event.starts_at
                                                            ? new Date(
                                                                  event.starts_at,
                                                              ).toLocaleDateString(
                                                                  'pt-BR',
                                                                  {
                                                                      dateStyle:
                                                                          'long',
                                                                  },
                                                              )
                                                            : 'A definir')}
                                                </dd>
                                            </div>
                                            <div>
                                                <dt>Horário</dt>
                                                <dd>
                                                    {event.starts_at
                                                        ? new Date(
                                                              event.starts_at,
                                                          ).toLocaleTimeString(
                                                              'pt-BR',
                                                              {
                                                                  hour: '2-digit',
                                                                  minute: '2-digit',
                                                              },
                                                          )
                                                        : 'A definir'}
                                                </dd>
                                            </div>
                                            <div>
                                                <dt>Local</dt>
                                                <dd>{event.location}</dd>
                                            </div>
                                        </dl>
                                        {event.registration_url ? (
                                            <a
                                                className="button button-event"
                                                href={event.registration_url}
                                                target={
                                                    event.registration_url.startsWith(
                                                        'http',
                                                    )
                                                        ? '_blank'
                                                        : undefined
                                                }
                                                rel="noreferrer"
                                            >
                                                Participar ↗
                                            </a>
                                        ) : (
                                            <Link
                                                className="button button-event"
                                                href="/#contato"
                                            >
                                                Pedir informações →
                                            </Link>
                                        )}
                                    </div>
                                </article>
                            ))
                        ) : (
                            <div className="events-empty">
                                <h3>Nenhum evento nesta categoria</h3>
                                <p>
                                    Escolha outro filtro ou volte em breve para
                                    acompanhar novas ações.
                                </p>
                            </div>
                        )}
                    </div>
                    <Pagination page={events} />
                </section>
                <section className="events-team">
                    <div className="events-team-image events-team-logo">
                        <img
                            src="/azon-social-logo-v2.webp"
                            alt="Logomarca do Instituto Azon Social"
                            width="721"
                            height="721"
                            loading="lazy"
                        />
                    </div>
                    <div>
                        <p className="eyebrow light">Quem faz acontecer</p>
                        <h2>Projetos feitos por pessoas, para pessoas.</h2>
                        <p>
                            Conheça quem cultiva saberes, cuida da vida e honra
                            nossas raízes em cada ação do Instituto.
                        </p>
                        <Link className="text-link light" href="/#projetos">
                            Conheça nossos projetos →
                        </Link>
                    </div>
                </section>
            </main>
            <PublicFooter />
        </>
    );
}

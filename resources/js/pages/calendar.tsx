import { Link } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityTools } from '@/components/accessibility-tools';
import { PublicFooter, PublicHeader } from '@/components/public-site-chrome';
import { SeoHead } from '@/components/seo-head';
import type { Event } from '@/types/cms';
import type { SeoData } from '@/types/seo';

const siteTimeZone = 'America/Sao_Paulo';
const weekDays = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

type IconName = 'calendar' | 'left' | 'right' | 'clock' | 'location' | 'close';

function Icon({ name }: { name: IconName }) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            {name === 'calendar' && (
                <>
                    <rect x="3" y="5" width="18" height="16" rx="2" />
                    <path d="M8 3v4M16 3v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" />
                </>
            )}
            {name === 'left' && <path d="m15 18-6-6 6-6" />}
            {name === 'right' && <path d="m9 18 6-6-6-6" />}
            {name === 'clock' && (
                <>
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 7v5l3 2" />
                </>
            )}
            {name === 'location' && (
                <>
                    <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
                    <circle cx="12" cy="10" r="2.5" />
                </>
            )}
            {name === 'close' && <path d="m6 6 12 12M18 6 6 18" />}
        </svg>
    );
}

function zonedDateParts(value: string | Date) {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: siteTimeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).formatToParts(typeof value === 'string' ? new Date(value) : value);
    const part = (type: Intl.DateTimeFormatPartTypes) =>
        Number(parts.find((item) => item.type === type)?.value ?? 0);

    return { year: part('year'), month: part('month'), day: part('day') };
}

function dateKey(value: string) {
    const { year, month, day } = zonedDateParts(value);

    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function formatDate(value: string) {
    return new Intl.DateTimeFormat('pt-BR', {
        timeZone: siteTimeZone,
        dateStyle: 'long',
    }).format(new Date(value));
}

function formatTime(value: string) {
    return new Intl.DateTimeFormat('pt-BR', {
        timeZone: siteTimeZone,
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(value));
}

function formatSchedule(event: Event) {
    if (!event.starts_at) return event.date_label ?? 'Data a definir';

    const start = `${formatDate(event.starts_at)}, às ${formatTime(event.starts_at)}`;
    if (!event.ends_at) return start;

    const sameDay = dateKey(event.starts_at) === dateKey(event.ends_at);

    return sameDay
        ? `${formatDate(event.starts_at)}, das ${formatTime(event.starts_at)} às ${formatTime(event.ends_at)}`
        : `${start}, até ${formatDate(event.ends_at)}, às ${formatTime(event.ends_at)}`;
}

function initialMonth(events: Event[]) {
    const dated = events.filter(
        (event): event is Event & { starts_at: string } =>
            Boolean(event.starts_at),
    );
    const now = Date.now();
    const reference =
        dated.find((event) => new Date(event.starts_at).getTime() >= now) ??
        dated.at(-1);
    const parts = reference?.starts_at
        ? zonedDateParts(reference.starts_at)
        : zonedDateParts(new Date());

    return new Date(parts.year, parts.month - 1, 1);
}

export default function CalendarPage({
    seo,
    events,
}: {
    seo: SeoData;
    events: Event[];
}) {
    const [month, setMonth] = useState(() => initialMonth(events));
    const [selected, setSelected] = useState<Event | null>(null);
    const [detailStatus, setDetailStatus] = useState<
        'idle' | 'loading' | 'error'
    >('idle');
    const closeButtonRef = useRef<HTMLButtonElement>(null);
    const dialogRef = useRef<HTMLElement>(null);
    const triggerRef = useRef<HTMLButtonElement | null>(null);
    const detailRequestRef = useRef<AbortController | null>(null);
    const monthYear = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`;
    const monthLabel = new Intl.DateTimeFormat('pt-BR', {
        month: 'long',
        year: 'numeric',
    }).format(month);
    const datedEvents = useMemo(
        () =>
            events
                .filter((event): event is Event & { starts_at: string } =>
                    Boolean(event.starts_at),
                )
                .filter((event) =>
                    dateKey(event.starts_at).startsWith(monthYear),
                )
                .sort(
                    (a, b) =>
                        new Date(a.starts_at).getTime() -
                        new Date(b.starts_at).getTime(),
                ),
        [events, monthYear],
    );
    const undatedEvents = events.filter((event) => !event.starts_at);
    const eventsByDay = useMemo(() => {
        const grouped = new Map<number, Event[]>();
        datedEvents.forEach((event) => {
            const day = zonedDateParts(event.starts_at).day;
            grouped.set(day, [...(grouped.get(day) ?? []), event]);
        });

        return grouped;
    }, [datedEvents]);
    const firstWeekday =
        (new Date(month.getFullYear(), month.getMonth(), 1).getDay() + 6) % 7;
    const daysInMonth = new Date(
        month.getFullYear(),
        month.getMonth() + 1,
        0,
    ).getDate();
    const cells = Array.from(
        { length: firstWeekday + daysInMonth },
        (_, index) => (index < firstWeekday ? null : index - firstWeekday + 1),
    );

    const isDialogOpen = selected !== null;

    useEffect(() => {
        if (!isDialogOpen) return;
        const previousOverflow = document.body.style.overflow;
        const backgroundElements = Array.from(
            document.querySelectorAll<HTMLElement>(
                '.skip-link, .accessibility-tools, .site-header, #conteudo-principal, footer',
            ),
        );
        const previousInert = backgroundElements.map((element) =>
            element.hasAttribute('inert'),
        );
        document.body.style.overflow = 'hidden';
        backgroundElements.forEach((element) => {
            element.inert = true;
        });
        closeButtonRef.current?.focus();
        const handleDialogKeys = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                detailRequestRef.current?.abort();
                setSelected(null);
                return;
            }
            if (event.key !== 'Tab') return;

            const focusable = Array.from(
                dialogRef.current?.querySelectorAll<HTMLElement>(
                    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
                ) ?? [],
            ).filter(
                (element) =>
                    element.getClientRects().length > 0 &&
                    element.getAttribute('aria-hidden') !== 'true',
            );
            if (focusable.length === 0) {
                event.preventDefault();
                return;
            }
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (
                !event.shiftKey &&
                (document.activeElement === last ||
                    !dialogRef.current?.contains(document.activeElement))
            ) {
                event.preventDefault();
                first.focus();
            }
        };
        window.addEventListener('keydown', handleDialogKeys);

        return () => {
            document.body.style.overflow = previousOverflow;
            window.removeEventListener('keydown', handleDialogKeys);
            backgroundElements.forEach((element, index) => {
                element.inert = previousInert[index];
            });
            const originalTrigger = triggerRef.current;
            const visibleTrigger = Array.from(
                document.querySelectorAll<HTMLButtonElement>(
                    `[data-calendar-event="${CSS.escape(selected.slug)}"]`,
                ),
            ).find((element) => element.getClientRects().length > 0);

            if (
                originalTrigger?.isConnected &&
                originalTrigger.getClientRects().length > 0
            ) {
                originalTrigger.focus();
            } else {
                visibleTrigger?.focus();
            }
        };
    }, [isDialogOpen]);

    async function loadEventDetails(event: Event) {
        detailRequestRef.current?.abort();
        const request = new AbortController();
        detailRequestRef.current = request;
        setDetailStatus('loading');

        try {
            const response = await fetch(
                `/calendario/eventos/${encodeURIComponent(event.slug)}`,
                {
                    headers: { Accept: 'application/json' },
                    signal: request.signal,
                },
            );
            if (!response.ok) throw new Error('Event details unavailable');
            const payload = (await response.json()) as { event?: Event };
            if (!payload.event) throw new Error('Invalid event response');
            setSelected(payload.event);
            setDetailStatus('idle');
        } catch (error) {
            if (error instanceof DOMException && error.name === 'AbortError') {
                return;
            }
            setDetailStatus('error');
        }
    }

    function openEvent(event: Event, trigger: HTMLButtonElement) {
        triggerRef.current = trigger;
        setSelected(event);
        void loadEventDetails(event);
    }

    function closeEvent() {
        detailRequestRef.current?.abort();
        detailRequestRef.current = null;
        setSelected(null);
        setDetailStatus('idle');
    }

    function moveMonth(offset: number) {
        setMonth(
            (current) =>
                new Date(current.getFullYear(), current.getMonth() + offset, 1),
        );
    }

    return (
        <>
            <SeoHead seo={seo} />
            <AccessibilityTools />
            <PublicHeader />
            <main
                className="calendar-page"
                id="conteudo-principal"
                tabIndex={-1}
            >
                <section className="calendar-hero">
                    <div>
                        <p className="eyebrow light">Agenda Azon Social</p>
                        <h1>
                            Calendário de encontros, <em>cuidado e axé.</em>
                        </h1>
                    </div>
                    <p>
                        Consulte as datas das ações, abra cada evento para
                        conhecer os detalhes e veja como participar.
                    </p>
                </section>

                <section
                    className="calendar-section"
                    aria-labelledby="calendar-title"
                >
                    <div className="calendar-heading">
                        <div>
                            <p className="eyebrow">Próximas ações</p>
                            <h2 id="calendar-title">Calendário</h2>
                        </div>
                        <Link className="text-link" href="/eventos">
                            Ver agenda completa →
                        </Link>
                    </div>

                    <div className="calendar-board">
                        <div className="calendar-month-controls">
                            <button
                                type="button"
                                onClick={() => moveMonth(-1)}
                                aria-label="Ver mês anterior"
                            >
                                <Icon name="left" />
                            </button>
                            <h3 aria-live="polite">{monthLabel}</h3>
                            <button
                                type="button"
                                onClick={() => moveMonth(1)}
                                aria-label="Ver próximo mês"
                            >
                                <Icon name="right" />
                            </button>
                        </div>

                        <div className="calendar-grid-shell">
                            <div
                                className="calendar-weekdays"
                                aria-hidden="true"
                            >
                                {weekDays.map((day) => (
                                    <span key={day}>{day}</span>
                                ))}
                            </div>
                            <div className="calendar-grid">
                                {cells.map((day, index) => (
                                    <div
                                        className={
                                            day
                                                ? 'calendar-day'
                                                : 'calendar-day empty'
                                        }
                                        key={`${monthYear}-${index}`}
                                    >
                                        {day && (
                                            <>
                                                <span className="calendar-day-number">
                                                    {day}
                                                </span>
                                                {(
                                                    eventsByDay.get(day) ?? []
                                                ).map((event) => (
                                                    <button
                                                        type="button"
                                                        className="calendar-event-chip"
                                                        key={event.id}
                                                        data-calendar-event={
                                                            event.slug
                                                        }
                                                        onClick={(click) =>
                                                            openEvent(
                                                                event,
                                                                click.currentTarget,
                                                            )
                                                        }
                                                        aria-label={`Ver detalhes de ${event.title}: ${formatSchedule(event)}`}
                                                    >
                                                        {event.title}
                                                    </button>
                                                ))}
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="calendar-mobile-list">
                            {datedEvents.length ? (
                                datedEvents.map((event) => (
                                    <button
                                        type="button"
                                        className="calendar-mobile-event"
                                        key={event.id}
                                        data-calendar-event={event.slug}
                                        onClick={(click) =>
                                            openEvent(
                                                event,
                                                click.currentTarget,
                                            )
                                        }
                                        aria-label={`Ver detalhes de ${event.title}: ${formatSchedule(event)}`}
                                    >
                                        <span>
                                            {
                                                zonedDateParts(event.starts_at)
                                                    .day
                                            }
                                            <small>
                                                {new Intl.DateTimeFormat(
                                                    'pt-BR',
                                                    {
                                                        timeZone: siteTimeZone,
                                                        month: 'short',
                                                    },
                                                ).format(
                                                    new Date(event.starts_at),
                                                )}
                                            </small>
                                        </span>
                                        <strong>{event.title}</strong>
                                        <Icon name="right" />
                                    </button>
                                ))
                            ) : (
                                <p className="calendar-empty-month">
                                    Nenhum evento com data marcada neste mês.
                                </p>
                            )}
                        </div>
                    </div>

                    {undatedEvents.length > 0 && (
                        <div className="calendar-continuous">
                            <div className="calendar-continuous-heading">
                                <Icon name="calendar" />
                                <div>
                                    <p className="eyebrow">Datas abertas</p>
                                    <h2>Inscrições e atividades contínuas</h2>
                                </div>
                            </div>
                            <div className="calendar-continuous-list">
                                {undatedEvents.map((event) => (
                                    <button
                                        type="button"
                                        key={event.id}
                                        onClick={(click) =>
                                            openEvent(
                                                event,
                                                click.currentTarget,
                                            )
                                        }
                                        aria-label={`Ver detalhes de ${event.title}: ${formatSchedule(event)}`}
                                    >
                                        <span>
                                            {event.date_label ??
                                                'Data a definir'}
                                        </span>
                                        <strong>{event.title}</strong>
                                        <small>{event.location}</small>
                                        <b>Ver detalhes →</b>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </section>
            </main>
            <PublicFooter />

            {selected && (
                <div
                    className="calendar-dialog-backdrop"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) closeEvent();
                    }}
                >
                    <section
                        ref={dialogRef}
                        className={`calendar-dialog${selected.cover_url ? '' : ' without-cover'}`}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="calendar-dialog-title"
                    >
                        <button
                            ref={closeButtonRef}
                            className="calendar-dialog-close"
                            type="button"
                            aria-label="Fechar detalhes do evento"
                            onClick={closeEvent}
                        >
                            <Icon name="close" />
                        </button>
                        {selected.cover_url && (
                            <img
                                className="calendar-dialog-cover"
                                src={selected.cover_url}
                                alt={selected.cover_alt ?? selected.title}
                            />
                        )}
                        <div className="calendar-dialog-content">
                            <p className="eyebrow">Evento Azon Social</p>
                            <h2 id="calendar-dialog-title">{selected.title}</h2>
                            <p className="calendar-dialog-summary">
                                {selected.summary}
                            </p>
                            {detailStatus === 'loading' && (
                                <p
                                    className="calendar-dialog-status"
                                    role="status"
                                >
                                    Carregando detalhes do evento…
                                </p>
                            )}
                            {detailStatus === 'error' && (
                                <div
                                    className="calendar-dialog-status error"
                                    role="alert"
                                >
                                    <p>
                                        Não foi possível carregar todos os
                                        detalhes agora.
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            void loadEventDetails(selected)
                                        }
                                    >
                                        Tentar novamente
                                    </button>
                                </div>
                            )}
                            <dl>
                                <div>
                                    <Icon name="clock" />
                                    <dt>Data e horário</dt>
                                    <dd>{formatSchedule(selected)}</dd>
                                </div>
                                <div>
                                    <Icon name="location" />
                                    <dt>Local</dt>
                                    <dd>{selected.location}</dd>
                                </div>
                            </dl>
                            {detailStatus === 'idle' && selected.body && (
                                <div className="calendar-dialog-details">
                                    <h3>Mais detalhes</h3>
                                    <p>{selected.body}</p>
                                </div>
                            )}
                            {detailStatus === 'idle' && (
                                <div className="calendar-dialog-participation">
                                    <h3>Como participar</h3>
                                    <p>
                                        {selected.participation_details ??
                                            'Fale com a equipe do Instituto Azon Social para receber as orientações de participação.'}
                                    </p>
                                    {selected.registration_url ? (
                                        <a
                                            className="button button-event"
                                            href={selected.registration_url}
                                            target={
                                                selected.registration_url.startsWith(
                                                    'http',
                                                )
                                                    ? '_blank'
                                                    : undefined
                                            }
                                            rel="noopener noreferrer"
                                        >
                                            Fazer inscrição ↗
                                        </a>
                                    ) : (
                                        <Link
                                            className="button button-event"
                                            href="/#contato"
                                        >
                                            Falar com a equipe →
                                        </Link>
                                    )}
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            )}
        </>
    );
}

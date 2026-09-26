import { Link, router } from '@inertiajs/react';
import {
    type FormEvent,
    type ReactNode,
    useEffect,
    useId,
    useRef,
    useState,
} from 'react';
import type { ContentStatus, Paginated } from '@/types/cms';
import { statusLabels } from '@/types/cms';

export function PageHeading({
    title,
    description,
    children,
}: {
    title: string;
    description: string;
    children?: ReactNode;
}) {
    return (
        <header className="cms-page-heading">
            <div>
                <h1>{title}</h1>
                <p>{description}</p>
            </div>
            {children && (
                <div className="cms-page-heading-actions">{children}</div>
            )}
        </header>
    );
}

export function StatusBadge({ status }: { status: string }) {
    const label =
        status in statusLabels ? statusLabels[status as ContentStatus] : status;
    return <span className={`cms-status ${status}`}>{label}</span>;
}

export function EmptyState({
    title,
    description,
    action,
}: {
    title: string;
    description: string;
    action?: ReactNode;
}) {
    return (
        <div className="cms-empty">
            <span aria-hidden="true">A</span>
            <h2>{title}</h2>
            <p>{description}</p>
            {action}
        </div>
    );
}

export function FieldError({ message }: { message?: string }) {
    return message ? (
        <span className="cms-field-error" role="alert">
            {message}
        </span>
    ) : null;
}

export function Pagination<T>({ page }: { page: Paginated<T> }) {
    const [isLoading, setIsLoading] = useState(false);
    if (page.total === 0) return null;

    const pageNumbers = Array.from(
        new Set([
            1,
            page.last_page,
            page.current_page - 2,
            page.current_page - 1,
            page.current_page,
            page.current_page + 1,
            page.current_page + 2,
        ]),
    )
        .filter((value) => value >= 1 && value <= page.last_page)
        .sort((a, b) => a - b);
    const previousUrl = page.links[0]?.url ?? null;
    const nextUrl = page.links.at(-1)?.url ?? null;

    function pageUrl(pageNumber: number) {
        const url = new URL(page.path, 'http://localhost');
        if (typeof window !== 'undefined') {
            new URLSearchParams(window.location.search).forEach((value, key) =>
                url.searchParams.set(key, value),
            );
        }
        url.searchParams.set('page', String(pageNumber));

        return `${url.pathname}${url.search}`;
    }

    function changePerPage(value: string) {
        if (typeof window === 'undefined') return;
        const query = Object.fromEntries(
            new URLSearchParams(window.location.search),
        );
        delete query.page;
        query.per_page = value;
        router.get(window.location.pathname, query, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
            onStart: () => setIsLoading(true),
            onFinish: () => setIsLoading(false),
        });
    }

    function loadingProps() {
        return {
            preserveScroll: true,
            onStart: () => setIsLoading(true),
            onFinish: () => setIsLoading(false),
        };
    }

    return (
        <nav
            className="cms-pagination"
            aria-label="Paginação"
            aria-busy={isLoading}
        >
            <div className="cms-pagination-summary">
                <p>
                    Exibindo {page.from ?? 0}–{page.to ?? 0} de {page.total}{' '}
                    registros
                </p>
                <label>
                    <span className="sr-only">Registros por página</span>
                    <select
                        value={page.per_page}
                        onChange={(event) => changePerPage(event.target.value)}
                        disabled={isLoading}
                    >
                        {[10, 20, 50, 100].map((value) => (
                            <option key={value} value={value}>
                                {value} por página
                            </option>
                        ))}
                    </select>
                </label>
                {isLoading && (
                    <span className="cms-list-loading" role="status">
                        Atualizando…
                    </span>
                )}
            </div>
            {page.last_page > 1 && (
                <>
                    <div className="cms-pagination-pages cms-pagination-desktop">
                        {previousUrl ? (
                            <Link href={previousUrl} {...loadingProps()}>
                                ← Anterior
                            </Link>
                        ) : (
                            <span aria-disabled="true">← Anterior</span>
                        )}
                        {pageNumbers.map((pageNumber, index) => (
                            <span
                                className="cms-pagination-slot"
                                key={pageNumber}
                            >
                                {index > 0 &&
                                    pageNumber - pageNumbers[index - 1] > 1 && (
                                        <i aria-hidden="true">…</i>
                                    )}
                                <Link
                                    href={pageUrl(pageNumber)}
                                    className={
                                        pageNumber === page.current_page
                                            ? 'active'
                                            : ''
                                    }
                                    aria-current={
                                        pageNumber === page.current_page
                                            ? 'page'
                                            : undefined
                                    }
                                    {...loadingProps()}
                                >
                                    {pageNumber}
                                </Link>
                            </span>
                        ))}
                        {nextUrl ? (
                            <Link href={nextUrl} {...loadingProps()}>
                                Próxima →
                            </Link>
                        ) : (
                            <span aria-disabled="true">Próxima →</span>
                        )}
                    </div>
                    <div className="cms-pagination-mobile">
                        {previousUrl ? (
                            <Link
                                href={previousUrl}
                                aria-label="Página anterior"
                                {...loadingProps()}
                            >
                                ←
                            </Link>
                        ) : (
                            <span aria-disabled="true">←</span>
                        )}
                        <strong>
                            Página {page.current_page} de {page.last_page}
                        </strong>
                        {nextUrl ? (
                            <Link
                                href={nextUrl}
                                aria-label="Próxima página"
                                {...loadingProps()}
                            >
                                →
                            </Link>
                        ) : (
                            <span aria-disabled="true">→</span>
                        )}
                    </div>
                </>
            )}
        </nav>
    );
}

type ListingFilterOption = { value: string; label: string };

export type ListingFilterField = {
    name: string;
    label: string;
    type?: 'select' | 'date' | 'text';
    options?: ListingFilterOption[];
    placeholder?: string;
};

export const contentStatusFilter: ListingFilterField = {
    name: 'status',
    label: 'Status',
    options: [
        { value: '', label: 'Todos' },
        ...Object.entries(statusLabels).map(([value, label]) => ({
            value,
            label,
        })),
    ],
};

type ListingFilterValue = string | number | null | undefined;

function compactFilters(filters: Record<string, ListingFilterValue>) {
    return Object.fromEntries(
        Object.entries(filters).filter(
            ([key, value]) =>
                key !== 'page' &&
                value !== '' &&
                value !== null &&
                value !== undefined,
        ),
    );
}

export function hasActiveListingFilters(
    filters: Record<string, ListingFilterValue>,
    defaultValues: Record<string, ListingFilterValue> = {},
) {
    return Object.entries(filters).some(
        ([name, value]) =>
            name !== 'per_page' &&
            String(value ?? '') !== String(defaultValues[name] ?? ''),
    );
}

export function SearchInput({
    label,
    value,
    placeholder,
    loading,
    onChange,
    onClear,
}: {
    label: string;
    value: string;
    placeholder: string;
    loading?: boolean;
    onChange: (value: string) => void;
    onClear: () => void;
}) {
    const inputId = useId();

    return (
        <label className="cms-filter-search" htmlFor={inputId}>
            <span>{label}</span>
            <span className="cms-search-input">
                <svg aria-hidden="true" viewBox="0 0 24 24">
                    <path d="m20 20-4.35-4.35m2.35-5.15a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z" />
                </svg>
                <input
                    id={inputId}
                    type="search"
                    value={value}
                    placeholder={placeholder}
                    onChange={(event) => onChange(event.target.value)}
                    autoComplete="off"
                />
                {loading ? (
                    <span className="cms-search-spinner" aria-hidden="true" />
                ) : value ? (
                    <button
                        type="button"
                        aria-label="Limpar pesquisa"
                        onClick={onClear}
                    >
                        ×
                    </button>
                ) : null}
            </span>
        </label>
    );
}

export function ListingFilters({
    basePath,
    filters,
    searchPlaceholder,
    searchLabel = 'Pesquisar',
    searchName = 'search',
    fields = [],
    defaultValues = {},
}: {
    basePath: string;
    filters: Record<string, ListingFilterValue>;
    searchPlaceholder: string;
    searchLabel?: string;
    searchName?: string;
    fields?: ListingFilterField[];
    defaultValues?: Record<string, ListingFilterValue>;
}) {
    const serverSearch = String(filters[searchName] ?? '');
    const [search, setSearch] = useState(serverSearch);
    const [isLoading, setIsLoading] = useState(false);
    const debounceTimer = useRef<number | null>(null);

    useEffect(() => setSearch(serverSearch), [serverSearch]);

    function visit(nextFilters: Record<string, ListingFilterValue>) {
        if (debounceTimer.current !== null) {
            window.clearTimeout(debounceTimer.current);
            debounceTimer.current = null;
        }
        router.get(basePath, compactFilters(nextFilters), {
            preserveState: true,
            preserveScroll: true,
            replace: true,
            onStart: () => setIsLoading(true),
            onFinish: () => setIsLoading(false),
        });
    }

    function apply(name: string, value: string) {
        visit({
            ...filters,
            [searchName]: search.trim() || undefined,
            [name]: value || undefined,
        });
    }

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        visit({
            ...filters,
            [searchName]: search.trim() || undefined,
        });
    }

    useEffect(() => {
        if (search.trim() === serverSearch) return;
        debounceTimer.current = window.setTimeout(() => {
            visit({
                ...filters,
                [searchName]: search.trim() || undefined,
            });
        }, 400);

        return () => {
            if (debounceTimer.current !== null) {
                window.clearTimeout(debounceTimer.current);
                debounceTimer.current = null;
            }
        };
        // The server filter is the synchronization boundary for each visit.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search, serverSearch]);

    const hasFilters = hasActiveListingFilters(filters, defaultValues);

    function clear() {
        visit({ ...defaultValues, per_page: filters.per_page });
    }

    return (
        <form
            className="cms-toolbar"
            role="search"
            onSubmit={submit}
            aria-busy={isLoading}
        >
            <SearchInput
                label={searchLabel}
                value={search}
                placeholder={searchPlaceholder}
                loading={isLoading}
                onChange={setSearch}
                onClear={() => setSearch('')}
            />
            {fields.map((filter) => (
                <label key={filter.name}>
                    <span>{filter.label}</span>
                    {filter.type === 'date' || filter.type === 'text' ? (
                        <input
                            type={filter.type}
                            value={String(filters[filter.name] ?? '')}
                            placeholder={filter.placeholder}
                            onChange={(event) =>
                                apply(filter.name, event.target.value)
                            }
                        />
                    ) : (
                        <select
                            value={String(filters[filter.name] ?? '')}
                            onChange={(event) =>
                                apply(filter.name, event.target.value)
                            }
                        >
                            {(filter.options ?? []).map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    )}
                </label>
            ))}
            {hasFilters && (
                <button
                    type="button"
                    className="cms-toolbar-clear"
                    onClick={clear}
                >
                    Limpar filtros
                </button>
            )}
            <button type="submit" className="sr-only">
                Pesquisar
            </button>
            <span className="cms-filter-status" aria-live="polite">
                {isLoading ? 'Atualizando resultados…' : ''}
            </span>
        </form>
    );
}

export function FormActions({
    processing,
    isDirty,
    isNew = false,
    cancelHref,
    currentStatus,
    canPublish,
    canSchedule = false,
    onIntent,
}: {
    processing: boolean;
    isDirty: boolean;
    isNew?: boolean;
    cancelHref: string;
    currentStatus: ContentStatus;
    canPublish: boolean;
    canSchedule?: boolean;
    onIntent: (status: ContentStatus) => void;
}) {
    return (
        <div className="cms-form-actions">
            <span aria-live="polite">
                {processing
                    ? 'Salvando…'
                    : isDirty
                      ? 'Há alterações não salvas.'
                      : isNew
                        ? 'Preencha os campos para criar este conteúdo.'
                        : 'Tudo salvo.'}
            </span>
            <div className="cms-form-action-buttons">
                <Link className="cms-button secondary" href={cancelHref}>
                    Cancelar
                </Link>
                <button
                    className="cms-button secondary"
                    type="submit"
                    name="status_intent"
                    value="draft"
                    onClick={() => onIntent('draft')}
                    disabled={processing}
                >
                    Salvar rascunho
                </button>
                {!isNew && (
                    <button
                        className="cms-button secondary"
                        type="submit"
                        name="status_intent"
                        value="archived"
                        onClick={() => onIntent('archived')}
                        disabled={processing}
                    >
                        {currentStatus === 'archived'
                            ? 'Salvar arquivado'
                            : 'Arquivar'}
                    </button>
                )}
                {!canPublish && (
                    <button
                        className="cms-button primary"
                        type="submit"
                        name="status_intent"
                        value="review"
                        onClick={() => onIntent('review')}
                        disabled={processing}
                    >
                        Enviar para revisão
                    </button>
                )}
                {canPublish && (
                    <>
                        <button
                            className="cms-button secondary"
                            type="submit"
                            name="status_intent"
                            value="review"
                            onClick={() => onIntent('review')}
                            disabled={processing}
                        >
                            Enviar para revisão
                        </button>
                        <button
                            className="cms-button secondary"
                            type="submit"
                            name="status_intent"
                            value="scheduled"
                            onClick={() => onIntent('scheduled')}
                            disabled={processing || !canSchedule}
                            title={
                                canSchedule
                                    ? undefined
                                    : 'Informe a data e a hora de publicação para agendar.'
                            }
                        >
                            {currentStatus === 'scheduled'
                                ? 'Atualizar agendamento'
                                : 'Agendar'}
                        </button>
                        <button
                            className="cms-button primary"
                            type="submit"
                            name="status_intent"
                            value="published"
                            onClick={() => onIntent('published')}
                            disabled={processing}
                        >
                            {processing
                                ? 'Salvando…'
                                : currentStatus === 'published'
                                  ? 'Salvar publicação'
                                  : 'Publicar agora'}
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}

export function ConfirmDeleteButton({
    label,
    onConfirm,
}: {
    label: string;
    onConfirm: () => void;
}) {
    const [open, setOpen] = useState(false);
    const dialogRef = useRef<HTMLDialogElement>(null);
    const titleId = useId();

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;
        if (open && !dialog.open) dialog.showModal();
        if (!open && dialog.open) dialog.close();
    }, [open]);

    function confirmDelete() {
        setOpen(false);
        onConfirm();
    }

    return (
        <>
            <button
                type="button"
                className="cms-text-action danger"
                onClick={() => setOpen(true)}
            >
                Excluir
            </button>
            <dialog
                ref={dialogRef}
                className="cms-confirm-dialog"
                aria-labelledby={titleId}
                onClose={() => setOpen(false)}
                onCancel={() => setOpen(false)}
            >
                <div className="cms-confirm-dialog-body">
                    <span aria-hidden="true">!</span>
                    <div>
                        <h2 id={titleId}>Mover para a lixeira?</h2>
                        <p>
                            O item <strong>“{label}”</strong> deixará de
                            aparecer no site, mas continuará recuperável no
                            sistema.
                        </p>
                    </div>
                </div>
                <div className="cms-confirm-dialog-actions">
                    <button
                        type="button"
                        className="cms-button secondary"
                        onClick={() => setOpen(false)}
                    >
                        Manter item
                    </button>
                    <button
                        type="button"
                        className="cms-button danger"
                        onClick={confirmDelete}
                    >
                        Mover para a lixeira
                    </button>
                </div>
            </dialog>
        </>
    );
}

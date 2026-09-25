import { Link, router } from '@inertiajs/react';
import type { FormEvent, ReactNode } from 'react';
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
    if (page.last_page <= 1) return null;
    return (
        <nav className="cms-pagination" aria-label="Paginação">
            <p>
                Exibindo {page.from ?? 0}–{page.to ?? 0} de {page.total}
            </p>
            <div>
                {page.links.map((link) =>
                    link.url ? (
                        <Link
                            key={`${link.label}-${link.url}`}
                            href={link.url}
                            className={link.active ? 'active' : ''}
                            aria-current={link.active ? 'page' : undefined}
                            preserveScroll
                        >
                            {link.label
                                .replace('&laquo;', '‹')
                                .replace('&raquo;', '›')}
                        </Link>
                    ) : (
                        <span key={link.label} aria-disabled="true">
                            {link.label
                                .replace('&laquo;', '‹')
                                .replace('&raquo;', '›')}
                        </span>
                    ),
                )}
            </div>
        </nav>
    );
}

type ListingFilterOption = { value: string; label: string };

export function ListingFilters({
    basePath,
    filters,
    searchPlaceholder,
    extra = [],
}: {
    basePath: string;
    filters: Record<string, string | null | undefined>;
    searchPlaceholder: string;
    extra?: Array<{
        name: string;
        label: string;
        options: ListingFilterOption[];
    }>;
}) {
    function apply(name: string, value: string) {
        router.get(
            basePath,
            { ...filters, [name]: value || undefined },
            { preserveState: true, replace: true },
        );
    }

    function search(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const value = data.get('search');
        apply('search', typeof value === 'string' ? value.trim() : '');
    }

    const hasFilters = Object.values(filters).some(Boolean);

    return (
        <form className="cms-toolbar" role="search" onSubmit={search}>
            <label>
                <span>Buscar</span>
                <span className="cms-search-control">
                    <input
                        name="search"
                        type="search"
                        defaultValue={filters.search ?? ''}
                        placeholder={searchPlaceholder}
                    />
                    <button type="submit" className="cms-button secondary">
                        Buscar
                    </button>
                </span>
            </label>
            <label>
                <span>Status</span>
                <select
                    value={filters.status ?? ''}
                    onChange={(event) => apply('status', event.target.value)}
                >
                    <option value="">Todos</option>
                    {Object.entries(statusLabels).map(([value, label]) => (
                        <option key={value} value={value}>
                            {label}
                        </option>
                    ))}
                </select>
            </label>
            {extra.map((filter) => (
                <label key={filter.name}>
                    <span>{filter.label}</span>
                    <select
                        value={filters[filter.name] ?? ''}
                        onChange={(event) =>
                            apply(filter.name, event.target.value)
                        }
                    >
                        {filter.options.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </label>
            ))}
            {hasFilters && (
                <Link className="cms-toolbar-clear" href={basePath}>
                    Limpar filtros
                </Link>
            )}
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
    function confirmDelete() {
        if (window.confirm(`Mover “${label}” para a lixeira?`)) {
            onConfirm();
        }
    }
    return (
        <button
            type="button"
            className="cms-text-action danger"
            onClick={confirmDelete}
        >
            Excluir
        </button>
    );
}

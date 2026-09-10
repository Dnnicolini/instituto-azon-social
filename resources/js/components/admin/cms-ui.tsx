import { Link } from '@inertiajs/react';
import type { ReactNode } from 'react';
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

export function FormActions({
    processing,
    isDirty,
    submitLabel = 'Salvar alterações',
    cancelHref,
}: {
    processing: boolean;
    isDirty: boolean;
    submitLabel?: string;
    cancelHref: string;
}) {
    return (
        <div className="cms-form-actions">
            <span aria-live="polite">
                {processing
                    ? 'Salvando…'
                    : isDirty
                      ? 'Há alterações não salvas.'
                      : 'Tudo salvo.'}
            </span>
            <div>
                <Link className="cms-button secondary" href={cancelHref}>
                    Cancelar
                </Link>
                <button
                    className="cms-button primary"
                    type="submit"
                    disabled={processing}
                >
                    {processing ? 'Salvando…' : submitLabel}
                </button>
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

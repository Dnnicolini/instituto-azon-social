import { useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { FieldError } from './cms-ui';
import { ApplicationStatusBadge } from './registration-ui';
import type { ApplicationStatus, ProjectApplication } from '@/types/cms';
import { applicationStatusLabels } from '@/types/cms';

export function ApplicationReviewPanel({
    projectId,
    application,
    statuses,
}: {
    projectId: number;
    application: ProjectApplication;
    statuses?: Array<{ value: ApplicationStatus; label: string }>;
}) {
    const statusForm = useForm<{ status: ApplicationStatus }>({
        status: application.status,
    });
    const noteForm = useForm({ note: '' });

    function updateStatus(event: FormEvent) {
        event.preventDefault();
        if (statusForm.processing) return;
        if (
            ['rejected', 'cancelled'].includes(statusForm.data.status) &&
            !window.confirm(
                `Confirmar o status “${applicationStatusLabels[statusForm.data.status]}” para esta candidatura?`,
            )
        )
            return;
        statusForm.patch(
            `/admin/projetos/${projectId}/inscricoes/${application.id}/status`,
            { preserveScroll: true },
        );
    }

    function addNote(event: FormEvent) {
        event.preventDefault();
        if (noteForm.processing || !noteForm.data.note.trim()) return;
        noteForm.post(
            `/admin/projetos/${projectId}/inscricoes/${application.id}/observacoes`,
            {
                preserveScroll: true,
                onSuccess: () => noteForm.reset(),
            },
        );
    }

    return (
        <aside className="cms-editor-side">
            <section className="cms-form-section">
                <h2>Situação da candidatura</h2>
                <ApplicationStatusBadge status={application.status} />
                <form onSubmit={updateStatus}>
                    <div className="cms-field">
                        <label htmlFor="application-status">
                            Alterar status
                        </label>
                        <select
                            id="application-status"
                            value={statusForm.data.status}
                            onChange={(event) =>
                                statusForm.setData(
                                    'status',
                                    event.target.value as ApplicationStatus,
                                )
                            }
                            aria-invalid={Boolean(statusForm.errors.status)}
                        >
                            {(
                                statuses ??
                                Object.entries(applicationStatusLabels).map(
                                    ([value, label]) => ({
                                        value: value as ApplicationStatus,
                                        label,
                                    }),
                                )
                            ).map(({ value, label }) => (
                                <option key={value} value={value}>
                                    {label}
                                </option>
                            ))}
                        </select>
                        <FieldError message={statusForm.errors.status} />
                    </div>
                    <button
                        className="cms-button primary"
                        type="submit"
                        disabled={statusForm.processing || !statusForm.isDirty}
                    >
                        {statusForm.processing
                            ? 'Atualizando…'
                            : 'Atualizar status'}
                    </button>
                </form>
            </section>

            <section className="cms-form-section">
                <h2>Observação interna</h2>
                <p className="cms-form-section-intro">
                    Visível somente para a equipe administrativa.
                </p>
                <form onSubmit={addNote}>
                    <div className="cms-field">
                        <label htmlFor="application-note">
                            Nova observação
                        </label>
                        <textarea
                            id="application-note"
                            rows={5}
                            maxLength={5000}
                            value={noteForm.data.note}
                            onChange={(event) =>
                                noteForm.setData('note', event.target.value)
                            }
                            aria-invalid={Boolean(noteForm.errors.note)}
                        />
                        <FieldError message={noteForm.errors.note} />
                    </div>
                    <button
                        className="cms-button secondary"
                        type="submit"
                        disabled={
                            noteForm.processing || !noteForm.data.note.trim()
                        }
                    >
                        {noteForm.processing
                            ? 'Adicionando…'
                            : 'Adicionar observação'}
                    </button>
                </form>
            </section>
        </aside>
    );
}

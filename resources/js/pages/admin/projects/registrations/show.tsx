import { Link } from '@inertiajs/react';
import { AdminLayout } from '@/components/admin/admin-layout';
import { ApplicationReviewPanel } from '@/components/admin/application-review-panel';
import { PageHeading } from '@/components/admin/cms-ui';
import { ProjectRegistrationNav } from '@/components/admin/project-registration-nav';
import { ApplicationStatusBadge } from '@/components/admin/registration-ui';
import { SeoHead } from '@/components/seo-head';
import type {
    AdminSharedProps,
    ApplicationStatus,
    Project,
    ProjectApplication,
} from '@/types/cms';
import { applicationStatusLabels } from '@/types/cms';

function formatDate(value?: string | null) {
    if (!value) return 'Não informado';
    return new Date(value).toLocaleString('pt-BR', {
        dateStyle: 'long',
        timeStyle: 'short',
    });
}

function renderAnswer(value: string | string[] | boolean | null) {
    if (Array.isArray(value)) return value.join(', ') || 'Não respondido';
    if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
    return value || 'Não respondido';
}

function formatBytes(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function historyTitle(event: string) {
    if (event === 'admin.note.added') return 'Observação interna';
    if (event === 'status.changed') return 'Status alterado';
    if (event === 'application.created') return 'Inscrição criada';
    if (event === 'application.submitted') return 'Inscrição enviada';
    if (event === 'application.updated') return 'Inscrição atualizada';
    if (event === 'document.updated') return 'Documento atualizado';
    return event;
}

export default function ApplicationShow({
    seo,
    project,
    application,
    statuses = [],
}: AdminSharedProps & {
    project: Project;
    application: ProjectApplication;
    statuses?: Array<{ value: ApplicationStatus; label: string }>;
}) {
    return (
        <>
            <SeoHead seo={seo} />
            <AdminLayout title={application.protocol}>
                <PageHeading
                    title={application.applicant_name}
                    description={`Candidatura ${application.protocol} em ${project.title}.`}
                >
                    <Link
                        className="cms-button secondary"
                        href={`/admin/projetos/${project.id}/inscricoes`}
                    >
                        Voltar aos candidatos
                    </Link>
                </PageHeading>
                <ProjectRegistrationNav
                    project={project}
                    current="applications"
                />

                <div className="cms-editor">
                    <div className="cms-editor-main">
                        <section className="cms-form-section">
                            <h2>Informações do sistema</h2>
                            <dl className="cms-message-list">
                                <div>
                                    <dt>Protocolo</dt>
                                    <dd>{application.protocol}</dd>
                                </div>
                                <div>
                                    <dt>Status</dt>
                                    <dd>
                                        <ApplicationStatusBadge
                                            status={application.status}
                                        />
                                    </dd>
                                </div>
                                <div>
                                    <dt>E-mail</dt>
                                    <dd>
                                        {application.applicant_email ??
                                            'Não informado'}
                                    </dd>
                                </div>
                                <div>
                                    <dt>CPF</dt>
                                    <dd>
                                        {application.applicant_cpf ??
                                            'Não informado'}
                                    </dd>
                                </div>
                                <div>
                                    <dt>Criada em</dt>
                                    <dd>
                                        {formatDate(application.created_at)}
                                    </dd>
                                </div>
                                <div>
                                    <dt>Enviada em</dt>
                                    <dd>
                                        {formatDate(application.submitted_at)}
                                    </dd>
                                </div>
                                <div>
                                    <dt>Última atualização</dt>
                                    <dd>
                                        {formatDate(application.updated_at)}
                                    </dd>
                                </div>
                            </dl>
                        </section>

                        <section className="cms-form-section">
                            <h2>Respostas</h2>
                            {Object.keys(application.answers).length ? (
                                <dl className="cms-message-list">
                                    {Object.entries(application.answers).map(
                                        ([identifier, answer]) => (
                                            <div key={identifier}>
                                                <dt>{answer.label}</dt>
                                                <dd>
                                                    {renderAnswer(answer.value)}
                                                </dd>
                                            </div>
                                        ),
                                    )}
                                </dl>
                            ) : (
                                <p>Nenhuma resposta foi registrada.</p>
                            )}
                        </section>

                        <section className="cms-form-section">
                            <h2>Documentos</h2>
                            {application.files.length ? (
                                <div className="cms-role-list">
                                    {application.files.map((file) => (
                                        <article key={file.id}>
                                            <div>
                                                <h3>{file.label}</h3>
                                                <p>{file.name}</p>
                                                <small>
                                                    {file.mime_type} •{' '}
                                                    {formatBytes(file.size)}
                                                </small>
                                            </div>
                                            <div className="cms-row-actions">
                                                <a href={file.url}>
                                                    Baixar arquivo
                                                </a>
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            ) : (
                                <p>Nenhum documento enviado.</p>
                            )}
                        </section>

                        <section className="cms-form-section">
                            <h2>Histórico e observações</h2>
                            {application.history.length ? (
                                <div className="cms-role-list">
                                    {application.history.map((entry) => (
                                        <article key={entry.id}>
                                            <div>
                                                <h3>
                                                    {historyTitle(entry.event)}
                                                </h3>
                                                {entry.note && (
                                                    <p>{entry.note}</p>
                                                )}
                                                {entry.from_status &&
                                                    entry.to_status && (
                                                        <p>
                                                            De{' '}
                                                            {applicationStatusLabels[
                                                                entry
                                                                    .from_status
                                                            ] ??
                                                                entry.from_status}{' '}
                                                            para{' '}
                                                            {applicationStatusLabels[
                                                                entry.to_status
                                                            ] ??
                                                                entry.to_status}
                                                        </p>
                                                    )}
                                                <small>
                                                    {entry.user ?? 'Sistema'} •{' '}
                                                    {formatDate(
                                                        entry.created_at,
                                                    )}
                                                </small>
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            ) : (
                                <p>O histórico ainda não possui eventos.</p>
                            )}
                        </section>
                    </div>

                    <ApplicationReviewPanel
                        projectId={project.id}
                        application={application}
                        statuses={statuses}
                    />
                </div>
            </AdminLayout>
        </>
    );
}

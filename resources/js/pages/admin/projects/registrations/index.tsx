import { Link } from '@inertiajs/react';
import { AdminLayout } from '@/components/admin/admin-layout';
import { EmptyState, PageHeading, Pagination } from '@/components/admin/cms-ui';
import { ProjectRegistrationNav } from '@/components/admin/project-registration-nav';
import {
    ApplicationFilters,
    ApplicationStatusBadge,
    buildApplicationExportUrl,
    RegistrationMetricsPanel,
} from '@/components/admin/registration-ui';
import { SeoHead } from '@/components/seo-head';
import type {
    AdminSharedProps,
    Paginated,
    Project,
    ProjectApplicationSummary,
    RegistrationMetrics,
} from '@/types/cms';

function formatDate(value?: string | null) {
    if (!value) return 'Ainda não enviada';
    return new Date(value).toLocaleString('pt-BR', {
        dateStyle: 'short',
        timeStyle: 'short',
    });
}

export default function ApplicationsIndex({
    seo,
    project,
    metrics,
    applications,
    filters = {},
    statuses = [],
}: AdminSharedProps & {
    project: Project;
    metrics: RegistrationMetrics;
    applications: Paginated<ProjectApplicationSummary>;
    filters?: Record<string, string | number | null | undefined>;
    statuses?: Array<{ value: string; label: string }>;
}) {
    return (
        <>
            <SeoHead seo={seo} />
            <AdminLayout title="Candidatos">
                <PageHeading
                    title="Candidatos"
                    description={`Acompanhe e analise as inscrições de ${project.title}.`}
                >
                    <a
                        className="cms-button secondary"
                        href={buildApplicationExportUrl(
                            project.id,
                            'csv',
                            filters,
                        )}
                    >
                        Exportar CSV
                    </a>
                    <a
                        className="cms-button secondary"
                        href={buildApplicationExportUrl(
                            project.id,
                            'xlsx',
                            filters,
                        )}
                    >
                        Exportar XLSX
                    </a>
                </PageHeading>
                <ProjectRegistrationNav
                    project={project}
                    current="applications"
                />

                <RegistrationMetricsPanel metrics={metrics} />
                <ApplicationFilters
                    projectId={project.id}
                    filters={filters}
                    statuses={statuses}
                />

                {applications.data.length ? (
                    <>
                        <div className="cms-table-wrap">
                            <table className="cms-table">
                                <thead>
                                    <tr>
                                        <th>Protocolo</th>
                                        <th>Candidato</th>
                                        <th>Inscrição</th>
                                        <th>Status</th>
                                        <th>Atualizada</th>
                                        <th>
                                            <span className="sr-only">
                                                Ações
                                            </span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {applications.data.map((application) => (
                                        <tr key={application.id}>
                                            <td>
                                                <strong>
                                                    {application.protocol}
                                                </strong>
                                            </td>
                                            <td>
                                                <strong>
                                                    {application.applicant_name}
                                                </strong>
                                                <small>
                                                    {application.applicant_email ??
                                                        'E-mail não informado'}
                                                </small>
                                            </td>
                                            <td>
                                                {formatDate(
                                                    application.submitted_at ??
                                                        application.created_at,
                                                )}
                                            </td>
                                            <td>
                                                <ApplicationStatusBadge
                                                    status={application.status}
                                                />
                                            </td>
                                            <td>
                                                {formatDate(
                                                    application.updated_at,
                                                )}
                                            </td>
                                            <td className="cms-row-actions">
                                                <Link
                                                    href={`/admin/projetos/${project.id}/inscricoes/${application.id}`}
                                                >
                                                    Analisar
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <Pagination page={applications} />
                    </>
                ) : (
                    <EmptyState
                        title="Nenhuma candidatura encontrada"
                        description="Ajuste os filtros ou aguarde o início das inscrições."
                    />
                )}
            </AdminLayout>
        </>
    );
}

import { Link } from '@inertiajs/react';
import { AccessibilityTools } from '@/components/accessibility-tools';
import { PublicSeoHead } from '@/components/applications/public-seo-head';
import { PublicFooter, PublicHeader } from '@/components/public-site-chrome';
import { formatAnswer, formatApplicationDate } from '@/lib/applications';
import { humanizeIdentifier } from '@/lib/cms-form';
import type { ApplicationShowProps } from '@/types/applications';

function historyLabel(event: string, toStatus?: string | null): string {
    const labels: Record<string, string> = {
        'application.created': 'Inscrição iniciada',
        'application.edited': 'Inscrição atualizada',
        'application.submitted': 'Inscrição enviada',
        'document.updated': 'Documento atualizado',
        'status.changed': 'Status atualizado',
    };

    if (event === 'status.changed' && toStatus) {
        return `Status atualizado para ${toStatus}`;
    }

    return labels[event] ?? 'Inscrição atualizada';
}

export default function ApplicationShow({
    seo,
    application,
    form,
    flash,
}: ApplicationShowProps) {
    const fieldsByIdentifier = new Map(
        (form?.fields ?? []).map((field) => [field.identifier, field]),
    );

    return (
        <>
            <PublicSeoHead
                seo={seo}
                fallbackTitle={
                    application.protocol
                        ? `Inscrição ${application.protocol}`
                        : 'Minha inscrição'
                }
            />
            <AccessibilityTools />
            <PublicHeader />
            <main
                className="application-detail-page"
                id="conteudo-principal"
                tabIndex={-1}
            >
                <header className="application-detail-heading">
                    <Link className="text-link" href="/minhas-inscricoes">
                        ← Voltar às minhas inscrições
                    </Link>
                    <p className="eyebrow">{application.project.title}</p>
                    <h1>
                        {application.protocol
                            ? `Inscrição ${application.protocol}`
                            : 'Rascunho de inscrição'}
                    </h1>
                    <p
                        className={`application-status application-status-${application.status}`}
                    >
                        {application.status_label}
                    </p>
                    {flash?.success && (
                        <output className="application-success-notice">
                            <strong>{flash.success}</strong>
                            {application.protocol && (
                                <span>
                                    Guarde o protocolo {application.protocol}.
                                </span>
                            )}
                        </output>
                    )}
                </header>

                <div className="application-detail-layout">
                    <article>
                        <section aria-labelledby="application-answers-title">
                            <header>
                                <h2 id="application-answers-title">
                                    Respostas enviadas
                                </h2>
                                {application.can_edit && (
                                    <Link
                                        className="text-link"
                                        href={`/projetos/${application.project.slug}/inscricao`}
                                    >
                                        Editar inscrição
                                    </Link>
                                )}
                            </header>
                            {Object.keys(application.answers).length > 0 ? (
                                <dl className="application-answer-list">
                                    {Object.entries(application.answers).map(
                                        ([identifier, value]) => {
                                            const field =
                                                fieldsByIdentifier.get(
                                                    identifier,
                                                );
                                            const answerField = field ?? {
                                                id: value.field_id,
                                                identifier,
                                                type: value.type,
                                                label: value.label,
                                                required: false,
                                            };
                                            return (
                                                <div key={identifier}>
                                                    <dt>
                                                        {value.label ??
                                                            field?.label ??
                                                            humanizeIdentifier(
                                                                identifier,
                                                            )}
                                                    </dt>
                                                    <dd>
                                                        {formatAnswer(
                                                            answerField,
                                                            value.value,
                                                        )}
                                                    </dd>
                                                </div>
                                            );
                                        },
                                    )}
                                </dl>
                            ) : (
                                <p>Nenhuma resposta foi salva até agora.</p>
                            )}
                        </section>

                        <section aria-labelledby="application-files-title">
                            <h2 id="application-files-title">Documentos</h2>
                            {application.files.length > 0 ? (
                                <ul className="application-file-list">
                                    {application.files.map((file) => (
                                        <li key={file.id}>
                                            <div>
                                                <strong>{file.label}</strong>
                                                <span>{file.name}</span>
                                            </div>
                                            <a href={file.url} download>
                                                Baixar arquivo
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p>Nenhum documento foi enviado.</p>
                            )}
                        </section>
                    </article>

                    <aside className="application-system-summary">
                        <h2>Informações da inscrição</h2>
                        <dl>
                            <div>
                                <dt>Protocolo</dt>
                                <dd>{application.protocol ?? 'Rascunho'}</dd>
                            </div>
                            <div>
                                <dt>Criada em</dt>
                                <dd>
                                    {formatApplicationDate(
                                        application.created_at,
                                        true,
                                    )}
                                </dd>
                            </div>
                            <div>
                                <dt>Enviada em</dt>
                                <dd>
                                    {formatApplicationDate(
                                        application.submitted_at,
                                        true,
                                    )}
                                </dd>
                            </div>
                            <div>
                                <dt>Última atualização</dt>
                                <dd>
                                    {formatApplicationDate(
                                        application.updated_at,
                                        true,
                                    )}
                                </dd>
                            </div>
                        </dl>
                    </aside>
                </div>

                {application.history && application.history.length > 0 && (
                    <section
                        className="application-history"
                        aria-labelledby="application-history-title"
                    >
                        <h2 id="application-history-title">Histórico</h2>
                        <ol>
                            {application.history.map((item) => (
                                <li key={item.id}>
                                    <span aria-hidden="true" />
                                    <div>
                                        <strong>
                                            {historyLabel(
                                                item.event,
                                                item.to_status,
                                            )}
                                        </strong>
                                        <time dateTime={item.created_at}>
                                            {formatApplicationDate(
                                                item.created_at,
                                                true,
                                            )}
                                        </time>
                                    </div>
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

import { Link } from '@inertiajs/react';
import { AccessibilityTools } from '@/components/accessibility-tools';
import { PublicSeoHead } from '@/components/applications/public-seo-head';
import { PublicFooter, PublicHeader } from '@/components/public-site-chrome';
import { formatApplicationDate } from '@/lib/applications';
import type { ApplicationsIndexProps } from '@/types/applications';

function paginationLabel(value: string): string {
    return value
        .replaceAll('&laquo;', '«')
        .replaceAll('&raquo;', '»')
        .replaceAll('&amp;', '&')
        .replace(/<[^>]*>/g, '')
        .trim();
}

export default function ApplicationsIndex({
    seo,
    applications,
}: ApplicationsIndexProps) {
    return (
        <>
            <PublicSeoHead seo={seo} fallbackTitle="Minhas inscrições" />
            <AccessibilityTools />
            <PublicHeader />
            <main
                className="applications-page"
                id="conteudo-principal"
                tabIndex={-1}
            >
                <header className="applications-heading">
                    <p className="eyebrow">Área do candidato</p>
                    <h1>Minhas inscrições</h1>
                    <p>
                        Acompanhe protocolos, prazos e atualizações das suas
                        candidaturas.
                    </p>
                </header>

                {applications.data.length > 0 ? (
                    <div className="applications-list">
                        {applications.data.map((application) => (
                            <article
                                className="application-list-item"
                                key={application.id}
                            >
                                <div>
                                    <p className="eyebrow">
                                        {application.protocol ?? 'Rascunho'}
                                    </p>
                                    <h2>{application.project.title}</h2>
                                    <p>
                                        {application.submitted_at
                                            ? `Enviada em ${formatApplicationDate(application.submitted_at)}`
                                            : `Criada em ${formatApplicationDate(application.created_at)}`}
                                    </p>
                                </div>
                                <dl>
                                    <div>
                                        <dt>Status</dt>
                                        <dd
                                            className={`application-status application-status-${application.status}`}
                                        >
                                            {application.status_label}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt>Prazo</dt>
                                        <dd>
                                            {application.registration_ends_at
                                                ? formatApplicationDate(
                                                      application.registration_ends_at,
                                                  )
                                                : 'Consulte o projeto'}
                                        </dd>
                                    </div>
                                </dl>
                                <div className="application-list-actions">
                                    <Link
                                        className="button button-outline"
                                        href={
                                            application.show_url ??
                                            `/minhas-inscricoes/${application.id}`
                                        }
                                    >
                                        Ver inscrição →
                                    </Link>
                                    {application.can_edit && (
                                        <Link
                                            className="text-link"
                                            href={`/projetos/${application.project.slug}/inscricao`}
                                        >
                                            Editar
                                        </Link>
                                    )}
                                </div>
                            </article>
                        ))}
                    </div>
                ) : (
                    <section className="applications-empty">
                        <h2>Você ainda não possui inscrições</h2>
                        <p>
                            Quando você iniciar uma candidatura, ela aparecerá
                            aqui com o prazo e o status atualizado.
                        </p>
                        <Link className="button button-gold" href="/#projetos">
                            Conhecer projetos →
                        </Link>
                    </section>
                )}

                {applications.last_page > 1 && (
                    <nav
                        className="applications-pagination"
                        aria-label="Paginação das inscrições"
                    >
                        {applications.links.map((link) =>
                            link.url ? (
                                <Link
                                    className={link.active ? 'active' : ''}
                                    href={link.url}
                                    aria-current={
                                        link.active ? 'page' : undefined
                                    }
                                    key={`${link.label}-${link.url}`}
                                >
                                    {paginationLabel(link.label)}
                                </Link>
                            ) : (
                                <span aria-disabled="true" key={link.label}>
                                    {paginationLabel(link.label)}
                                </span>
                            ),
                        )}
                    </nav>
                )}
            </main>
            <PublicFooter />
        </>
    );
}

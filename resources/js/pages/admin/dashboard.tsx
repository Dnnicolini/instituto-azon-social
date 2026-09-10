import { Link } from '@inertiajs/react';
import { AdminLayout } from '@/components/admin/admin-layout';
import {
    EmptyState,
    PageHeading,
    StatusBadge,
} from '@/components/admin/cms-ui';
import { SeoHead } from '@/components/seo-head';
import { Can } from '@/components/admin/use-can';
import type { AdminSharedProps, Post } from '@/types/cms';

type DashboardProps = AdminSharedProps & {
    stats: {
        posts: number;
        projects: number;
        events: number;
        unreadMessages: number;
        review_posts?: number;
    };
    recentPosts: Post[];
    scheduledPosts?: Post[];
};

const date = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' });

export default function Dashboard({
    seo,
    stats,
    recentPosts,
    scheduledPosts = [],
}: DashboardProps) {
    return (
        <>
            <SeoHead seo={seo} />
            <AdminLayout title="Visão geral">
                <PageHeading
                    title="O site, agora"
                    description="Acompanhe o fluxo editorial e as informações que precisam de atenção."
                >
                    <Can permission="content.create">
                        <Link
                            className="cms-button primary"
                            href="/admin/posts/create"
                        >
                            ＋ Novo conteúdo
                        </Link>
                    </Can>
                </PageHeading>
                <section className="admin-stats" aria-label="Resumo do site">
                    <article>
                        <span className="gold">▤</span>
                        <div>
                            <small>Conteúdos</small>
                            <strong>{stats.posts}</strong>
                            <em>{stats.review_posts ?? 0} em revisão</em>
                        </div>
                    </article>
                    <article>
                        <span className="blue">◆</span>
                        <div>
                            <small>Projetos</small>
                            <strong>{stats.projects}</strong>
                            <em>cadastrados</em>
                        </div>
                    </article>
                    <article>
                        <span className="green">□</span>
                        <div>
                            <small>Eventos</small>
                            <strong>{stats.events}</strong>
                            <em>cadastrados</em>
                        </div>
                    </article>
                    <article>
                        <span className="brown">✉</span>
                        <div>
                            <small>Mensagens novas</small>
                            <strong>{stats.unreadMessages}</strong>
                            <em>aguardando leitura</em>
                        </div>
                    </article>
                </section>
                <div className="admin-grid cms-dashboard-grid">
                    <section className="admin-panel">
                        <div className="admin-panel-heading">
                            <div>
                                <h2>Fila editorial</h2>
                                <p>Conteúdos alterados recentemente.</p>
                            </div>
                            <Link href="/admin/posts">Ver todos →</Link>
                        </div>
                        {recentPosts.length ? (
                            <div className="cms-table-wrap">
                                <table className="cms-table">
                                    <thead>
                                        <tr>
                                            <th>Conteúdo</th>
                                            <th>Tipo</th>
                                            <th>Status</th>
                                            <th>Atualização</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recentPosts.map((post) => (
                                            <tr key={post.id}>
                                                <td>
                                                    <Link
                                                        href={`/admin/posts/${post.id}/edit`}
                                                    >
                                                        <strong>
                                                            {post.title}
                                                        </strong>
                                                    </Link>
                                                </td>
                                                <td>{post.type}</td>
                                                <td>
                                                    <StatusBadge
                                                        status={post.status}
                                                    />
                                                </td>
                                                <td>
                                                    {date.format(
                                                        new Date(
                                                            post.updated_at,
                                                        ),
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <EmptyState
                                title="A fila está vazia"
                                description="Crie o primeiro conteúdo ou aguarde uma nova alteração editorial."
                                action={
                                    <Link
                                        className="cms-button secondary"
                                        href="/admin/posts/create"
                                    >
                                        Criar conteúdo
                                    </Link>
                                }
                            />
                        )}
                    </section>
                    <aside className="admin-panel schedule-panel">
                        <div className="admin-panel-heading">
                            <div>
                                <h2>Próximos agendamentos</h2>
                                <p>Publicações com data definida.</p>
                            </div>
                        </div>
                        {scheduledPosts.length ? (
                            <ol className="cms-schedule-list">
                                {scheduledPosts.map((post) => (
                                    <li key={post.id}>
                                        <time
                                            dateTime={post.published_at ?? ''}
                                        >
                                            {post.published_at
                                                ? date.format(
                                                      new Date(
                                                          post.published_at,
                                                      ),
                                                  )
                                                : 'Sem data'}
                                        </time>
                                        <Link
                                            href={`/admin/posts/${post.id}/edit`}
                                        >
                                            {post.title}
                                        </Link>
                                    </li>
                                ))}
                            </ol>
                        ) : (
                            <p className="cms-panel-empty">
                                Nenhum conteúdo agendado.
                            </p>
                        )}
                    </aside>
                </div>
            </AdminLayout>
        </>
    );
}

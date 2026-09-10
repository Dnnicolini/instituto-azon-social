import { Link, router } from '@inertiajs/react';
import { AdminLayout } from '@/components/admin/admin-layout';
import {
    ConfirmDeleteButton,
    EmptyState,
    PageHeading,
    Pagination,
    StatusBadge,
} from '@/components/admin/cms-ui';
import { SeoHead } from '@/components/seo-head';
import type { AdminSharedProps, Paginated, Post } from '@/types/cms';
import { typeLabels } from '@/types/cms';
import { Can } from '@/components/admin/use-can';

export default function PostsIndex({
    seo,
    posts,
    filters = {},
}: AdminSharedProps & {
    posts: Paginated<Post>;
    filters?: { search?: string; type?: string; status?: string };
}) {
    function filter(name: string, value: string) {
        router.get(
            '/admin/posts',
            { ...filters, [name]: value || undefined },
            { preserveState: true, replace: true },
        );
    }
    return (
        <>
            <SeoHead seo={seo} />
            <AdminLayout title="Conteúdos">
                <PageHeading
                    title="Conteúdos"
                    description="Artigos, vlogs, vídeos e podcasts em um único fluxo editorial."
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
                <div className="cms-toolbar">
                    <label>
                        <span>Buscar</span>
                        <input
                            type="search"
                            defaultValue={filters.search ?? ''}
                            placeholder="Título ou palavra-chave"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter')
                                    filter('search', e.currentTarget.value);
                            }}
                        />
                    </label>
                    <label>
                        <span>Formato</span>
                        <select
                            value={filters.type ?? ''}
                            onChange={(e) => filter('type', e.target.value)}
                        >
                            <option value="">Todos</option>
                            {Object.entries(typeLabels).map(
                                ([value, label]) => (
                                    <option value={value} key={value}>
                                        {label}
                                    </option>
                                ),
                            )}
                        </select>
                    </label>
                    <label>
                        <span>Status</span>
                        <select
                            value={filters.status ?? ''}
                            onChange={(e) => filter('status', e.target.value)}
                        >
                            <option value="">Todos</option>
                            <option value="draft">Rascunho</option>
                            <option value="review">Em revisão</option>
                            <option value="scheduled">Agendado</option>
                            <option value="published">Publicado</option>
                        </select>
                    </label>
                </div>
                {posts.data.length ? (
                    <>
                        <div className="cms-table-wrap">
                            <table className="cms-table">
                                <thead>
                                    <tr>
                                        <th>Título</th>
                                        <th>Formato</th>
                                        <th>Status</th>
                                        <th>Atualizado</th>
                                        <th>
                                            <span className="sr-only">
                                                Ações
                                            </span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {posts.data.map((post) => (
                                        <tr key={post.id}>
                                            <td>
                                                <Can
                                                    permission="content.update"
                                                    fallback={
                                                        <>
                                                            <strong>
                                                                {post.title}
                                                            </strong>
                                                            <small>
                                                                /{post.slug}
                                                            </small>
                                                        </>
                                                    }
                                                >
                                                    <Link
                                                        href={`/admin/posts/${post.id}/edit`}
                                                    >
                                                        <strong>
                                                            {post.title}
                                                        </strong>
                                                        <small>
                                                            /{post.slug}
                                                        </small>
                                                    </Link>
                                                </Can>
                                            </td>
                                            <td>{typeLabels[post.type]}</td>
                                            <td>
                                                <StatusBadge
                                                    status={post.status}
                                                />
                                            </td>
                                            <td>
                                                {new Date(
                                                    post.updated_at,
                                                ).toLocaleDateString('pt-BR')}
                                            </td>
                                            <td className="cms-row-actions">
                                                <Can permission="content.update">
                                                    <Link
                                                        href={`/admin/posts/${post.id}/edit`}
                                                    >
                                                        Editar
                                                    </Link>
                                                </Can>
                                                <Can permission="content.delete">
                                                    <ConfirmDeleteButton
                                                        label={post.title}
                                                        onConfirm={() =>
                                                            router.delete(
                                                                `/admin/posts/${post.id}`,
                                                                {
                                                                    preserveScroll: true,
                                                                },
                                                            )
                                                        }
                                                    />
                                                </Can>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <Pagination page={posts} />
                    </>
                ) : (
                    <EmptyState
                        title="Nenhum conteúdo encontrado"
                        description="Ajuste os filtros ou crie o primeiro conteúdo da biblioteca."
                        action={
                            <Can permission="content.create">
                                <Link
                                    className="cms-button primary"
                                    href="/admin/posts/create"
                                >
                                    Criar conteúdo
                                </Link>
                            </Can>
                        }
                    />
                )}
            </AdminLayout>
        </>
    );
}

import { Link, router } from '@inertiajs/react';
import { AdminLayout } from '@/components/admin/admin-layout';
import {
    ConfirmDeleteButton,
    contentStatusFilter,
    EmptyState,
    hasActiveListingFilters,
    ListingFilters,
    PageHeading,
    Pagination,
    StatusBadge,
} from '@/components/admin/cms-ui';
import { SeoHead } from '@/components/seo-head';
import type {
    AdminSharedProps,
    Paginated,
    Post,
    SelectOption,
} from '@/types/cms';
import { typeLabels } from '@/types/cms';
import { Can } from '@/components/admin/use-can';
import {
    postCreateHref,
    postEditHref,
    postIndexHref,
    postSectionContent,
    type PostSection,
    typesForSection,
} from '@/lib/admin-post-section';

export default function PostsIndex({
    seo,
    posts,
    filters = {},
    section,
    instagramAccounts = [],
}: AdminSharedProps & {
    posts: Paginated<Post>;
    filters?: {
        search?: string;
        type?: string;
        status?: string;
        per_page?: number;
        account?: number;
        media_type?: string;
        source_type?: string;
        from?: string;
        to?: string;
    };
    section: PostSection;
    instagramAccounts?: SelectOption[];
}) {
    const content = postSectionContent[section];
    const availableTypes = typesForSection(section);
    const defaultFilters = {
        type:
            section === 'media'
                ? 'media'
                : section === 'social'
                  ? 'social'
                  : undefined,
    };
    const hasFilters = hasActiveListingFilters(filters, defaultFilters);
    return (
        <>
            <SeoHead seo={seo} />
            <AdminLayout title={content.title}>
                <PageHeading
                    title={content.title}
                    description={content.description}
                >
                    <Can permission="content.create">
                        <Link
                            className="cms-button primary"
                            href={postCreateHref(section)}
                        >
                            ＋ {content.createLabel}
                        </Link>
                    </Can>
                </PageHeading>
                <ListingFilters
                    basePath={postIndexHref(section)}
                    filters={filters}
                    searchPlaceholder="Título ou palavra-chave"
                    fields={[
                        ...(section === 'media'
                            ? [
                                  {
                                      name: 'type',
                                      label: 'Formato',
                                      options: [
                                          {
                                              value: 'media',
                                              label: 'Todos',
                                          },
                                          ...availableTypes.map((value) => ({
                                              value,
                                              label: typeLabels[value],
                                          })),
                                      ],
                                  },
                              ]
                            : []),
                        ...(section === 'social'
                            ? [
                                  {
                                      name: 'account',
                                      label: 'Perfil',
                                      options: [
                                          { value: '', label: 'Todos' },
                                          ...instagramAccounts,
                                      ],
                                  },
                                  {
                                      name: 'media_type',
                                      label: 'Formato',
                                      options: [
                                          { value: '', label: 'Todos' },
                                          { value: 'IMAGE', label: 'Imagem' },
                                          {
                                              value: 'CAROUSEL_ALBUM',
                                              label: 'Carrossel',
                                          },
                                          { value: 'VIDEO', label: 'Vídeo' },
                                      ],
                                  },
                                  {
                                      name: 'source_type',
                                      label: 'Origem',
                                      options: [
                                          { value: '', label: 'Todas' },
                                          {
                                              value: 'automatic',
                                              label: 'Sincronização automática',
                                          },
                                          {
                                              value: 'manual',
                                              label: 'Cadastro manual',
                                          },
                                      ],
                                  },
                                  {
                                      name: 'from',
                                      label: 'De',
                                      type: 'date' as const,
                                  },
                                  {
                                      name: 'to',
                                      label: 'Até',
                                      type: 'date' as const,
                                  },
                              ]
                            : []),
                        contentStatusFilter,
                    ]}
                    defaultValues={defaultFilters}
                />
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
                                                        href={postEditHref(
                                                            post.id,
                                                            section,
                                                        )}
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
                                                        href={postEditHref(
                                                            post.id,
                                                            section,
                                                        )}
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
                        title={
                            hasFilters
                                ? 'Nenhum conteúdo encontrado'
                                : content.emptyTitle
                        }
                        description={
                            hasFilters
                                ? 'Ajuste a pesquisa ou limpe os filtros para consultar outros conteúdos.'
                                : content.emptyDescription
                        }
                        action={
                            hasFilters ? (
                                <Link
                                    className="cms-button secondary"
                                    href={postIndexHref(section)}
                                >
                                    Limpar filtros
                                </Link>
                            ) : (
                                <Can permission="content.create">
                                    <Link
                                        className="cms-button primary"
                                        href={postCreateHref(section)}
                                    >
                                        {content.createLabel}
                                    </Link>
                                </Can>
                            )
                        }
                    />
                )}
            </AdminLayout>
        </>
    );
}

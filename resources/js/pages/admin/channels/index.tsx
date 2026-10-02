import { Link } from '@inertiajs/react';
import { AdminLayout } from '@/components/admin/admin-layout';
import { PageHeading, StatusBadge } from '@/components/admin/cms-ui';
import { Can } from '@/components/admin/use-can';
import { SeoHead } from '@/components/seo-head';
import type { AdminSharedProps, ContentStatus } from '@/types/cms';

type Channel = {
    id: number;
    title: string;
    slug: string;
    status: ContentStatus;
    sections_count: number;
    updated_at: string;
    instagram: {
        id: number;
        display_name: string;
        username: string;
        connected: boolean;
        public_enabled: boolean;
        last_success_at?: string | null;
        posts_count: number;
        last_error?: string | null;
    } | null;
};

function formatSync(value?: string | null): string {
    return value
        ? new Date(value).toLocaleString('pt-BR', {
              dateStyle: 'short',
              timeStyle: 'short',
          })
        : 'Ainda não sincronizado';
}

export default function Channels({
    seo,
    channels,
}: AdminSharedProps & { channels: Channel[] }) {
    return (
        <>
            <SeoHead seo={seo} />
            <AdminLayout title="Gestão de canais">
                <PageHeading
                    title="Gestão de canais"
                    description="Edite a página, organize as seções e acompanhe o perfil oficial de cada canal em um só lugar."
                />
                <div className="channel-admin-table cms-table-wrap">
                    <table className="cms-table">
                        <thead>
                            <tr>
                                <th>Canal</th>
                                <th>Instagram</th>
                                <th>Publicação</th>
                                <th>Última sincronização</th>
                                <th>Itens</th>
                                <th>
                                    <span className="sr-only">Ações</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {channels.map((channel) => (
                                <tr key={channel.id}>
                                    <td>
                                        <strong>{channel.title}</strong>
                                        <small>
                                            {channel.sections_count} seções · /
                                            {channel.slug}
                                        </small>
                                    </td>
                                    <td>
                                        {channel.instagram ? (
                                            <>
                                                <strong>
                                                    @
                                                    {channel.instagram.username}
                                                </strong>
                                                <small>
                                                    {channel.instagram.connected
                                                        ? channel.instagram
                                                              .public_enabled
                                                            ? 'Conectado e visível'
                                                            : 'Conectado, exibição pausada'
                                                        : 'Aguardando conexão'}
                                                </small>
                                                {channel.instagram
                                                    .last_error && (
                                                    <small
                                                        className="channel-admin-warning"
                                                        role="status"
                                                    >
                                                        A sincronização requer
                                                        atenção
                                                    </small>
                                                )}
                                            </>
                                        ) : (
                                            <small>
                                                Nenhum perfil vinculado
                                            </small>
                                        )}
                                    </td>
                                    <td>
                                        <StatusBadge status={channel.status} />
                                    </td>
                                    <td>
                                        {formatSync(
                                            channel.instagram?.last_success_at,
                                        )}
                                    </td>
                                    <td>
                                        {channel.instagram?.posts_count ?? 0}{' '}
                                        publicações
                                    </td>
                                    <td className="cms-row-actions channel-admin-actions">
                                        <Can permission="content.update">
                                            <Link
                                                className="cms-button secondary"
                                                href={`/admin/paginas/${channel.id}/edit?context=channels`}
                                            >
                                                Gerenciar página
                                            </Link>
                                        </Can>
                                        <Can
                                            permission="instagram.manage"
                                            fallback={
                                                channel.instagram ? (
                                                    <Link
                                                        href={`/admin/posts?type=social&account=${channel.instagram.id}`}
                                                    >
                                                        Ver publicações
                                                    </Link>
                                                ) : null
                                            }
                                        >
                                            <Link
                                                className="cms-button primary"
                                                href="/admin/integracoes/instagram"
                                            >
                                                Configurar Instagram
                                            </Link>
                                        </Can>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <p className="channel-admin-note">
                    As postagens importadas entram em revisão por padrão. Nada é
                    publicado automaticamente sem a configuração explícita da
                    conta.
                </p>
            </AdminLayout>
        </>
    );
}

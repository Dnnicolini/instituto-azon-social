import { Link, router } from '@inertiajs/react';
import { AdminLayout } from '@/components/admin/admin-layout';
import { EmptyState, PageHeading } from '@/components/admin/cms-ui';
import { SeoHead } from '@/components/seo-head';
import type { AdminSharedProps, PermissionGroup } from '@/types/cms';

export default function Roles({
    seo,
    groups,
}: AdminSharedProps & {
    groups: PermissionGroup[];
}) {
    function remove(role: PermissionGroup) {
        if (window.confirm(`Excluir o grupo “${role.name}”?`)) {
            router.delete(`/admin/grupos/${role.id}`, {
                preserveScroll: true,
            });
        }
    }

    return (
        <>
            <SeoHead seo={seo} />
            <AdminLayout title="Grupos e permissões">
                <PageHeading
                    title="Grupos e permissões"
                    description="Agrupe responsabilidades sem conceder acesso além do necessário."
                >
                    <Link
                        className="cms-button secondary"
                        href="/admin/usuarios"
                    >
                        Voltar aos usuários
                    </Link>
                    <Link
                        className="cms-button primary"
                        href="/admin/grupos/create"
                    >
                        Novo grupo
                    </Link>
                </PageHeading>

                <section className="admin-panel">
                    <div className="admin-panel-heading">
                        <div>
                            <h2>Grupos cadastrados</h2>
                            <p>
                                {groups.length} grupo(s) organizam as permissões
                                da equipe.
                            </p>
                        </div>
                    </div>
                    {groups.length ? (
                        <div className="cms-role-list">
                            {groups.map((role) => (
                                <article key={role.id}>
                                    <div>
                                        <h3>{role.name}</h3>
                                        <p>
                                            {role.description ||
                                                'Sem descrição informada.'}
                                        </p>
                                        <small>
                                            {role.users_count} usuário(s) •{' '}
                                            {role.permissions.length} permissões
                                            {role.is_system
                                                ? ' • Grupo protegido pelo sistema'
                                                : ''}
                                        </small>
                                    </div>
                                    {!role.is_system && (
                                        <div className="cms-row-actions">
                                            <Link
                                                href={`/admin/grupos/${role.id}/edit`}
                                            >
                                                Editar
                                            </Link>
                                            <button
                                                type="button"
                                                className="danger"
                                                onClick={() => remove(role)}
                                            >
                                                Excluir
                                            </button>
                                        </div>
                                    )}
                                </article>
                            ))}
                        </div>
                    ) : (
                        <EmptyState
                            title="Nenhum grupo"
                            description="Crie um grupo para distribuir permissões."
                            action={
                                <Link
                                    className="cms-button primary"
                                    href="/admin/grupos/create"
                                >
                                    Novo grupo
                                </Link>
                            }
                        />
                    )}
                </section>
            </AdminLayout>
        </>
    );
}

import { AdminLayout } from '@/components/admin/admin-layout';
import { PageHeading } from '@/components/admin/cms-ui';
import { UserForm, type AccessRole } from '@/components/admin/user-form';
import { SeoHead } from '@/components/seo-head';
import type { AdminSharedProps, ManagedUser } from '@/types/cms';

export default function Edit({
    seo,
    managedUser,
    roles,
}: AdminSharedProps & {
    managedUser: ManagedUser;
    roles: AccessRole[];
}) {
    return (
        <>
            <SeoHead seo={seo} />
            <AdminLayout title="Editar usuário">
                <PageHeading
                    title={managedUser.name}
                    description="Atualize os dados e o nível de acesso. Ativação e senha continuam disponíveis na listagem."
                />
                <UserForm user={managedUser} roles={roles} />
            </AdminLayout>
        </>
    );
}

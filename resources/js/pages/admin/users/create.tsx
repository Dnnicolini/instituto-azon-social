import { AdminLayout } from '@/components/admin/admin-layout';
import { PageHeading } from '@/components/admin/cms-ui';
import { UserForm, type AccessRole } from '@/components/admin/user-form';
import { SeoHead } from '@/components/seo-head';
import type { AdminSharedProps } from '@/types/cms';

export default function Create({
    seo,
    roles,
}: AdminSharedProps & { roles: AccessRole[] }) {
    return (
        <>
            <SeoHead seo={seo} />
            <AdminLayout title="Convidar usuário">
                <PageHeading
                    title="Convidar usuário"
                    description="Informe quem receberá acesso e escolha as responsabilidades da pessoa."
                />
                <UserForm roles={roles} />
            </AdminLayout>
        </>
    );
}

import { AdminLayout } from '@/components/admin/admin-layout';
import { PageHeading } from '@/components/admin/cms-ui';
import { RoleForm, type PermissionOption } from '@/components/admin/role-form';
import { SeoHead } from '@/components/seo-head';
import type { AdminSharedProps } from '@/types/cms';

export default function Create({
    seo,
    permissions,
}: AdminSharedProps & { permissions: PermissionOption[] }) {
    return (
        <>
            <SeoHead seo={seo} />
            <AdminLayout title="Novo grupo">
                <PageHeading
                    title="Novo grupo"
                    description="Defina uma função clara e conceda somente as permissões necessárias."
                />
                <RoleForm permissions={permissions} />
            </AdminLayout>
        </>
    );
}

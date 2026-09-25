import { AdminLayout } from '@/components/admin/admin-layout';
import { PageHeading } from '@/components/admin/cms-ui';
import { RoleForm, type PermissionOption } from '@/components/admin/role-form';
import { SeoHead } from '@/components/seo-head';
import type { AdminSharedProps, PermissionGroup } from '@/types/cms';

export default function Edit({
    seo,
    group,
    permissions,
}: AdminSharedProps & {
    group: PermissionGroup;
    permissions: PermissionOption[];
}) {
    return (
        <>
            <SeoHead seo={seo} />
            <AdminLayout title="Editar grupo">
                <PageHeading
                    title={group.name}
                    description="Revise a responsabilidade e mantenha somente os acessos necessários."
                />
                <RoleForm role={group} permissions={permissions} />
            </AdminLayout>
        </>
    );
}

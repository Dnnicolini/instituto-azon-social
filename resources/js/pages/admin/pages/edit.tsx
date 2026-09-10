import { AdminLayout } from '@/components/admin/admin-layout';
import { PageHeading } from '@/components/admin/cms-ui';
import { PageForm } from '@/components/admin/page-form';
import { SeoHead } from '@/components/seo-head';
import type { AdminSharedProps, SitePage } from '@/types/cms';
export default function Edit({
    seo,
    page,
}: AdminSharedProps & { page: SitePage }) {
    return (
        <>
            <SeoHead seo={seo} />
            <AdminLayout title="Editar página">
                <PageHeading
                    title={page.title}
                    description="Altere a mensagem sem quebrar a identidade visual do site."
                />
                <PageForm page={page} />
            </AdminLayout>
        </>
    );
}

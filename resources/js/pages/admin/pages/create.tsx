import { AdminLayout } from '@/components/admin/admin-layout';
import { PageHeading } from '@/components/admin/cms-ui';
import { PageForm } from '@/components/admin/page-form';
import { SeoHead } from '@/components/seo-head';
import type { AdminSharedProps } from '@/types/cms';
export default function Create({ seo }: AdminSharedProps) {
    return (
        <>
            <SeoHead seo={seo} />
            <AdminLayout title="Nova página">
                <PageHeading
                    title="Nova página"
                    description="Monte uma página com seções de conteúdo seguras e consistentes."
                />
                <PageForm />
            </AdminLayout>
        </>
    );
}

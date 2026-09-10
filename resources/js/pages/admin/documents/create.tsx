import { AdminLayout } from '@/components/admin/admin-layout';
import { DocumentForm } from '@/components/admin/document-form';
import { PageHeading } from '@/components/admin/cms-ui';
import { SeoHead } from '@/components/seo-head';
import type { AdminSharedProps } from '@/types/cms';
export default function Create({ seo }: AdminSharedProps) {
    return (
        <>
            <SeoHead seo={seo} />
            <AdminLayout title="Novo documento">
                <PageHeading
                    title="Novo documento"
                    description="Envie um PDF acessível e informe como ele deve aparecer no site."
                />
                <DocumentForm />
            </AdminLayout>
        </>
    );
}

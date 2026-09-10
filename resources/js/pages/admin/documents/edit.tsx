import { AdminLayout } from '@/components/admin/admin-layout';
import { DocumentForm } from '@/components/admin/document-form';
import { PageHeading } from '@/components/admin/cms-ui';
import { SeoHead } from '@/components/seo-head';
import type { AdminSharedProps, TransparencyDocument } from '@/types/cms';
type Detail = TransparencyDocument & {
    slug: string;
    description?: string | null;
};
export default function Edit({
    seo,
    document,
}: AdminSharedProps & { document: Detail }) {
    return (
        <>
            <SeoHead seo={seo} />
            <AdminLayout title="Editar documento">
                <PageHeading
                    title={document.title}
                    description="Atualize os metadados ou substitua o arquivo PDF."
                />
                <DocumentForm document={document} />
            </AdminLayout>
        </>
    );
}

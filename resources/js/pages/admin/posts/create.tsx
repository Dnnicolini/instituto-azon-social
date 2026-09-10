import { AdminLayout } from '@/components/admin/admin-layout';
import { PageHeading } from '@/components/admin/cms-ui';
import { PostForm } from '@/components/admin/post-form';
import { SeoHead } from '@/components/seo-head';
import type { AdminSharedProps } from '@/types/cms';
export default function CreatePost({ seo }: AdminSharedProps) {
    return (
        <>
            <SeoHead seo={seo} />
            <AdminLayout title="Novo conteúdo">
                <PageHeading
                    title="Novo conteúdo"
                    description="Comece como rascunho e avance pelo fluxo editorial quando estiver pronto."
                />
                <PostForm />
            </AdminLayout>
        </>
    );
}

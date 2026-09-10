import { AdminLayout } from '@/components/admin/admin-layout';
import { PageHeading } from '@/components/admin/cms-ui';
import { PostForm } from '@/components/admin/post-form';
import { SeoHead } from '@/components/seo-head';
import type { AdminSharedProps, Post } from '@/types/cms';
export default function EditPost({
    seo,
    post,
}: AdminSharedProps & { post: Post }) {
    return (
        <>
            <SeoHead seo={seo} />
            <AdminLayout title="Editar conteúdo">
                <PageHeading
                    title={post.title}
                    description="Atualize o conteúdo, a publicação e sua apresentação nos buscadores."
                />
                <PostForm post={post} />
            </AdminLayout>
        </>
    );
}

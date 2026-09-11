import { AdminLayout } from '@/components/admin/admin-layout';
import { PageHeading } from '@/components/admin/cms-ui';
import { PostForm } from '@/components/admin/post-form';
import { SeoHead } from '@/components/seo-head';
import type { AdminSharedProps, Post } from '@/types/cms';
import { postSectionContent, type PostSection } from '@/lib/admin-post-section';
export default function EditPost({
    seo,
    post,
    section,
}: AdminSharedProps & { post: Post; section: PostSection }) {
    const content = postSectionContent[section];
    return (
        <>
            <SeoHead seo={seo} />
            <AdminLayout title={`Editar em ${content.title}`}>
                <PageHeading
                    title={post.title}
                    description="Atualize o conteúdo, a publicação e sua apresentação nos buscadores."
                />
                <PostForm post={post} section={section} />
            </AdminLayout>
        </>
    );
}

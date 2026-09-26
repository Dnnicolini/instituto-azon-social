import { AdminLayout } from '@/components/admin/admin-layout';
import { PageHeading } from '@/components/admin/cms-ui';
import { PostForm } from '@/components/admin/post-form';
import { SeoHead } from '@/components/seo-head';
import type { AdminSharedProps, Post, SelectOption } from '@/types/cms';
import { postSectionContent, type PostSection } from '@/lib/admin-post-section';
export default function EditPost({
    seo,
    post,
    section,
    projectOptions = [],
}: AdminSharedProps & {
    post: Post;
    section: PostSection;
    projectOptions?: SelectOption[];
}) {
    const content = postSectionContent[section];
    return (
        <>
            <SeoHead seo={seo} />
            <AdminLayout title={`Editar em ${content.title}`}>
                <PageHeading
                    title={post.title}
                    description="Atualize o conteúdo e defina quando ele deve ser publicado."
                />
                <PostForm
                    post={post}
                    section={section}
                    projectOptions={projectOptions}
                />
            </AdminLayout>
        </>
    );
}

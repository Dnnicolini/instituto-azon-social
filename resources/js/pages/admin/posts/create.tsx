import { AdminLayout } from '@/components/admin/admin-layout';
import { PageHeading } from '@/components/admin/cms-ui';
import { PostForm } from '@/components/admin/post-form';
import { SeoHead } from '@/components/seo-head';
import type { AdminSharedProps } from '@/types/cms';
import type { ContentType } from '@/types/cms';
import { postSectionContent, type PostSection } from '@/lib/admin-post-section';

export default function CreatePost({
    seo,
    section,
    initialType,
}: AdminSharedProps & { section: PostSection; initialType: ContentType }) {
    const content = postSectionContent[section];
    return (
        <>
            <SeoHead seo={seo} />
            <AdminLayout title={content.createLabel}>
                <PageHeading
                    title={content.createLabel}
                    description="Comece como rascunho e avance pelo fluxo editorial quando estiver pronto."
                />
                <PostForm section={section} initialType={initialType} />
            </AdminLayout>
        </>
    );
}

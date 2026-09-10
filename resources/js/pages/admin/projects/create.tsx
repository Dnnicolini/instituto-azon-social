import { AdminLayout } from '@/components/admin/admin-layout';
import { PageHeading } from '@/components/admin/cms-ui';
import { ProjectForm } from '@/components/admin/project-form';
import { SeoHead } from '@/components/seo-head';
import type { AdminSharedProps } from '@/types/cms';
export default function Create({ seo }: AdminSharedProps) {
    return (
        <>
            <SeoHead seo={seo} />
            <AdminLayout title="Novo projeto">
                <PageHeading
                    title="Novo projeto"
                    description="Apresente objetivo, atuação e identidade visual da iniciativa."
                />
                <ProjectForm />
            </AdminLayout>
        </>
    );
}

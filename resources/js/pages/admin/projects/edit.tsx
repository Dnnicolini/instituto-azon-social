import { AdminLayout } from '@/components/admin/admin-layout';
import { PageHeading } from '@/components/admin/cms-ui';
import { ProjectForm } from '@/components/admin/project-form';
import { SeoHead } from '@/components/seo-head';
import type { AdminSharedProps, Project } from '@/types/cms';
export default function Edit({
    seo,
    project,
}: AdminSharedProps & { project: Project }) {
    return (
        <>
            <SeoHead seo={seo} />
            <AdminLayout title="Editar projeto">
                <PageHeading
                    title={project.title}
                    description="Mantenha as informações da iniciativa atualizadas."
                />
                <ProjectForm project={project} />
            </AdminLayout>
        </>
    );
}

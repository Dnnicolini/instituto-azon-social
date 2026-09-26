import { AdminLayout } from '@/components/admin/admin-layout';
import { PageHeading } from '@/components/admin/cms-ui';
import { ProjectRegistrationNav } from '@/components/admin/project-registration-nav';
import { RegistrationFormBuilder } from '@/components/admin/registration-form-builder';
import { SeoHead } from '@/components/seo-head';
import type {
    AdminSharedProps,
    Project,
    ProjectRegistrationField,
    RegistrationFormSource,
} from '@/types/cms';

export default function RegistrationForm({
    seo,
    project,
    form,
    sourceProjects = [],
}: AdminSharedProps & {
    project: Project;
    form: {
        id: number;
        version: number;
        fields: ProjectRegistrationField[];
    };
    sourceProjects?: RegistrationFormSource[];
}) {
    return (
        <>
            <SeoHead seo={seo} />
            <AdminLayout title="Formulário de inscrição">
                <PageHeading
                    title="Formulário de candidatura"
                    description={`Escolha o que será solicitado a quem se candidatar a ${project.title}.`}
                />
                <ProjectRegistrationNav project={project} current="form" />
                <RegistrationFormBuilder
                    project={project}
                    fields={form.fields}
                    formSources={sourceProjects}
                />
            </AdminLayout>
        </>
    );
}

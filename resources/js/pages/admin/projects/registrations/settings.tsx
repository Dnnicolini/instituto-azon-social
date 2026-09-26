import { AdminLayout } from '@/components/admin/admin-layout';
import { PageHeading } from '@/components/admin/cms-ui';
import { ProjectRegistrationNav } from '@/components/admin/project-registration-nav';
import { RegistrationSettingsForm } from '@/components/admin/registration-settings-form';
import { SeoHead } from '@/components/seo-head';
import type {
    AdminSharedProps,
    Project,
    ProjectRegistration,
} from '@/types/cms';

export default function RegistrationSettings({
    seo,
    project,
    registration,
}: AdminSharedProps & {
    project: Project;
    registration: ProjectRegistration;
}) {
    return (
        <>
            <SeoHead seo={seo} />
            <AdminLayout title="Inscrições do projeto">
                <PageHeading
                    title="Configuração das inscrições"
                    description={`Defina prazos, regras e mensagens de ${project.title}.`}
                />
                <ProjectRegistrationNav project={project} current="settings" />
                <RegistrationSettingsForm
                    project={project}
                    registration={registration}
                />
            </AdminLayout>
        </>
    );
}

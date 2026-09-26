import { Link } from '@inertiajs/react';
import type { Project } from '@/types/cms';

export type ProjectRegistrationSection =
    | 'project'
    | 'settings'
    | 'form'
    | 'applications';

export function ProjectRegistrationNav({
    project,
    current,
}: {
    project: Project;
    current: ProjectRegistrationSection;
}) {
    const links: Array<{
        key: ProjectRegistrationSection;
        label: string;
        href: string;
    }> = [
        {
            key: 'project',
            label: 'Informações',
            href: `/admin/projetos/${project.id}/edit`,
        },
    ];

    const registrationEnabled =
        project.registration_enabled ?? current !== 'project';
    const registrationType = project.registration_type ?? 'internal';

    if (registrationEnabled) {
        links.push({
            key: 'settings',
            label: 'Inscrições',
            href: `/admin/projetos/${project.id}/inscricoes/configuracao`,
        });
        if (registrationType === 'internal') {
            links.push(
                {
                    key: 'form',
                    label: 'Formulário',
                    href: `/admin/projetos/${project.id}/inscricoes/formulario`,
                },
                {
                    key: 'applications',
                    label: 'Candidatos',
                    href: `/admin/projetos/${project.id}/inscricoes`,
                },
            );
        }
    }

    return (
        <nav className="cms-inline-actions" aria-label="Área do projeto">
            {links.map((link) => (
                <Link
                    key={link.key}
                    className={`cms-button ${current === link.key ? 'primary' : 'secondary'}`}
                    href={link.href}
                    aria-current={current === link.key ? 'page' : undefined}
                >
                    {link.label}
                </Link>
            ))}
        </nav>
    );
}

import { Link, router, usePage } from '@inertiajs/react';
import { type ReactNode, useState } from 'react';
import { AdminIcon, type AdminIconName } from '@/components/admin/admin-icon';
import type { AdminSharedProps } from '@/types/cms';

const navigation: ReadonlyArray<{
    label: string;
    href: string;
    icon: AdminIconName;
    permission: string;
    administratorOnly?: boolean;
}> = [
    {
        label: 'Visão geral',
        href: '/admin',
        icon: 'home',
        permission: 'access-admin',
    },
    {
        label: 'Artigos',
        href: '/admin/posts',
        icon: 'file-text',
        permission: 'content.view',
    },
    {
        label: 'Mídia',
        href: '/admin/posts?type=media',
        icon: 'play-square',
        permission: 'content.view',
    },
    {
        label: 'Redes sociais',
        href: '/admin/posts?type=social',
        icon: 'share-nodes',
        permission: 'content.view',
    },
    {
        label: 'Projetos',
        href: '/admin/projetos',
        icon: 'sprout',
        permission: 'content.view',
    },
    {
        label: 'Eventos',
        href: '/admin/eventos',
        icon: 'calendar',
        permission: 'content.view',
    },
    {
        label: 'Transparência',
        href: '/admin/documentos',
        icon: 'shield-check',
        permission: 'content.view',
    },
    {
        label: 'Páginas',
        href: '/admin/paginas',
        icon: 'files',
        permission: 'content.view',
    },
    {
        label: 'Mensagens',
        href: '/admin/mensagens',
        icon: 'mail',
        permission: 'messages.view',
        administratorOnly: true,
    },
    {
        label: 'Usuários e grupos',
        href: '/admin/usuarios',
        icon: 'users',
        permission: 'users.manage',
    },
    {
        label: 'Configurações',
        href: '/admin/configuracoes',
        icon: 'settings',
        permission: 'settings.manage',
    },
    {
        label: 'Atividades e falhas',
        href: '/admin/logs',
        icon: 'activity',
        permission: 'access-admin',
        administratorOnly: true,
    },
] as const;

type AdminLayoutProps = {
    title: string;
    children: ReactNode;
    actions?: ReactNode;
};

export function AdminLayout({ title, children, actions }: AdminLayoutProps) {
    const [menuOpen, setMenuOpen] = useState(false);
    const page = usePage<AdminSharedProps>();
    const { auth, flash, unreadMessages = 0 } = page.props;
    const [currentPath, currentQuery = ''] = page.url.split('?');
    const query = new URLSearchParams(currentQuery);
    const currentSection = query.get('section');
    const currentType =
        query.get('type') ??
        (currentSection === 'media' || currentSection === 'social'
            ? currentSection
            : null);

    function logout() {
        router.post('/admin/logout');
    }

    return (
        <div className="admin-shell">
            {menuOpen && (
                <button
                    type="button"
                    className="admin-sidebar-scrim"
                    aria-label="Fechar menu"
                    onClick={() => setMenuOpen(false)}
                />
            )}
            <aside
                id="admin-navigation"
                className={menuOpen ? 'admin-sidebar open' : 'admin-sidebar'}
            >
                <Link className="admin-sidebar-brand" href="/" prefetch>
                    <span className="brand-mark">
                        <img
                            src="/azon-social-logo-v2.webp"
                            alt=""
                            width="721"
                            height="721"
                        />
                    </span>
                    <span>
                        <strong>Azon Social</strong>
                        <small>Gestão de conteúdo</small>
                    </span>
                </Link>
                <nav aria-label="Administração do site">
                    {navigation
                        .filter(
                            (item) =>
                                auth.user.permissions.includes(
                                    item.permission,
                                ) &&
                                (!('administratorOnly' in item) ||
                                    auth.user.roles.includes('administrator')),
                        )
                        .map((item) => {
                            const [itemPath] = item.href.split('?');
                            let active =
                                item.href === '/admin'
                                    ? currentPath === '/admin'
                                    : currentPath.startsWith(itemPath);
                            if (itemPath === '/admin/posts') {
                                const itemType = new URLSearchParams(
                                    item.href.split('?')[1] ?? '',
                                ).get('type');
                                const isMedia = [
                                    'media',
                                    'vlog',
                                    'video',
                                    'podcast',
                                ].includes(currentType ?? '');
                                active = itemType
                                    ? itemType === 'media'
                                        ? isMedia
                                        : currentType === itemType
                                    : !isMedia && currentType !== 'social';
                            }
                            return (
                                <Link
                                    key={item.href}
                                    className={active ? 'active' : ''}
                                    href={item.href}
                                    aria-current={active ? 'page' : undefined}
                                    onClick={() => setMenuOpen(false)}
                                    prefetch
                                >
                                    <span>
                                        <AdminIcon name={item.icon} />
                                    </span>
                                    {item.label}
                                    {item.label === 'Mensagens' &&
                                        unreadMessages > 0 && (
                                            <b
                                                aria-label={`${unreadMessages} mensagens não lidas`}
                                            >
                                                {unreadMessages}
                                            </b>
                                        )}
                                </Link>
                            );
                        })}
                </nav>
                <div className="admin-sidebar-footer">
                    <div className="admin-avatar" aria-hidden="true">
                        {auth.user.name
                            .split(' ')
                            .slice(0, 2)
                            .map((part) => part[0])
                            .join('')
                            .toUpperCase()}
                    </div>
                    <div>
                        <strong>{auth.user.name}</strong>
                        <small>{auth.user.roles.join(', ') || 'Usuário'}</small>
                    </div>
                    <button
                        type="button"
                        onClick={logout}
                        aria-label="Sair do painel"
                    >
                        <AdminIcon name="log-out" />
                    </button>
                </div>
            </aside>

            <main className="admin-main">
                <header className="admin-topbar">
                    <button
                        type="button"
                        className="admin-mobile-menu"
                        onClick={() => setMenuOpen((open) => !open)}
                        aria-expanded={menuOpen}
                        aria-controls="admin-navigation"
                        aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
                    >
                        <AdminIcon name="menu" />
                    </button>
                    <div>
                        <small>Instituto Azon Social</small>
                        <strong>{title}</strong>
                    </div>
                    <div className="admin-top-actions">
                        <Link href="/" target="_blank">
                            Ver site <AdminIcon name="external-link" />
                        </Link>
                    </div>
                </header>

                <div className="admin-content">
                    {flash?.success && (
                        <div className="cms-alert success" role="status">
                            {flash.success}
                        </div>
                    )}
                    {flash?.error && (
                        <div className="cms-alert error" role="alert">
                            {flash.error}
                        </div>
                    )}
                    {actions && (
                        <div className="admin-page-actions">{actions}</div>
                    )}
                    {children}
                </div>
            </main>
        </div>
    );
}

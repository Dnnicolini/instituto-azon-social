import { Link, router, usePage } from '@inertiajs/react';
import { type ReactNode, useState } from 'react';
import { AdminIcon, type AdminIconName } from '@/components/admin/admin-icon';
import type { AdminSharedProps } from '@/types/cms';

const navigation: ReadonlyArray<{
    group: 'Visão geral' | 'Conteúdo' | 'Relacionamento' | 'Administração';
    label: string;
    href: string;
    icon: AdminIconName;
    permission: string;
    administratorOnly?: boolean;
}> = [
    {
        group: 'Visão geral',
        label: 'Visão geral',
        href: '/admin',
        icon: 'home',
        permission: 'access-admin',
    },
    {
        group: 'Conteúdo',
        label: 'Artigos',
        href: '/admin/posts',
        icon: 'file-text',
        permission: 'content.view',
    },
    {
        group: 'Conteúdo',
        label: 'Mídia',
        href: '/admin/posts?type=media',
        icon: 'play-square',
        permission: 'content.view',
    },
    {
        group: 'Conteúdo',
        label: 'Redes sociais',
        href: '/admin/posts?type=social',
        icon: 'share-nodes',
        permission: 'content.view',
    },
    {
        group: 'Conteúdo',
        label: 'Projetos',
        href: '/admin/projetos',
        icon: 'sprout',
        permission: 'content.view',
    },
    {
        group: 'Conteúdo',
        label: 'Eventos',
        href: '/admin/eventos',
        icon: 'calendar',
        permission: 'content.view',
    },
    {
        group: 'Conteúdo',
        label: 'Transparência',
        href: '/admin/documentos',
        icon: 'shield-check',
        permission: 'content.view',
    },
    {
        group: 'Conteúdo',
        label: 'Páginas',
        href: '/admin/paginas',
        icon: 'files',
        permission: 'content.view',
    },
    {
        group: 'Relacionamento',
        label: 'Mensagens',
        href: '/admin/mensagens',
        icon: 'mail',
        permission: 'messages.view',
        administratorOnly: true,
    },
    {
        group: 'Administração',
        label: 'Usuários e grupos',
        href: '/admin/usuarios',
        icon: 'users',
        permission: 'users.manage',
    },
    {
        group: 'Administração',
        label: 'Configurações',
        href: '/admin/configuracoes',
        icon: 'settings',
        permission: 'settings.manage',
    },
    {
        group: 'Administração',
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
    const visibleNavigation = navigation.filter(
        (item) =>
            auth.user.permissions.includes(item.permission) &&
            (!('administratorOnly' in item) ||
                auth.user.roles.includes('administrator')),
    );

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
                    {[
                        'Visão geral',
                        'Conteúdo',
                        'Relacionamento',
                        'Administração',
                    ].map((group) => {
                        const items = visibleNavigation.filter(
                            (item) => item.group === group,
                        );
                        if (!items.length) return null;

                        return (
                            <section key={group} className="admin-nav-group">
                                <h2>{group}</h2>
                                {items.map((item) => {
                                    const [itemPath] = item.href.split('?');
                                    let active =
                                        item.href === '/admin'
                                            ? currentPath === '/admin'
                                            : currentPath.startsWith(itemPath);
                                    if (itemPath === '/admin/posts') {
                                        const isPostPage =
                                            currentPath === '/admin/posts' ||
                                            currentPath.startsWith(
                                                '/admin/posts/',
                                            );
                                        const itemType = new URLSearchParams(
                                            item.href.split('?')[1] ?? '',
                                        ).get('type');
                                        const isMedia = [
                                            'media',
                                            'vlog',
                                            'video',
                                            'podcast',
                                        ].includes(currentType ?? '');
                                        active =
                                            isPostPage &&
                                            (itemType
                                                ? itemType === 'media'
                                                    ? isMedia
                                                    : currentType === itemType
                                                : !isMedia &&
                                                  currentType !== 'social');
                                    }
                                    return (
                                        <Link
                                            key={item.href}
                                            className={active ? 'active' : ''}
                                            href={item.href}
                                            aria-current={
                                                active ? 'page' : undefined
                                            }
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
                            </section>
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

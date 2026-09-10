import { Link, router, usePage } from '@inertiajs/react';
import { type ReactNode, useState } from 'react';
import type { AdminSharedProps } from '@/types/cms';

const navigation = [
    {
        label: 'Visão geral',
        href: '/admin',
        icon: '⌂',
        permission: 'access-admin',
    },
    {
        label: 'Conteúdos',
        href: '/admin/posts',
        icon: '▤',
        permission: 'content.view',
    },
    {
        label: 'Mídia',
        href: '/admin/posts?type=media',
        icon: '▷',
        permission: 'content.view',
    },
    {
        label: 'Redes sociais',
        href: '/admin/posts?type=social',
        icon: '⌁',
        permission: 'content.view',
    },
    {
        label: 'Projetos',
        href: '/admin/projetos',
        icon: '◆',
        permission: 'content.view',
    },
    {
        label: 'Eventos',
        href: '/admin/eventos',
        icon: '□',
        permission: 'content.view',
    },
    {
        label: 'Transparência',
        href: '/admin/documentos',
        icon: '◎',
        permission: 'content.view',
    },
    {
        label: 'Páginas',
        href: '/admin/paginas',
        icon: '¶',
        permission: 'content.view',
    },
    {
        label: 'Mensagens',
        href: '/admin/mensagens',
        icon: '✉',
        permission: 'messages.view',
        administratorOnly: true,
    },
    {
        label: 'Usuários e grupos',
        href: '/admin/usuarios',
        icon: '♙',
        permission: 'users.manage',
    },
    {
        label: 'Configurações',
        href: '/admin/configuracoes',
        icon: '⚙',
        permission: 'settings.manage',
    },
] as const;

type AdminLayoutProps = {
    title: string;
    children: ReactNode;
    actions?: ReactNode;
};

export function AdminLayout({ title, children, actions }: AdminLayoutProps) {
    const [menuOpen, setMenuOpen] = useState(false);
    const {
        auth,
        flash,
        unreadMessages = 0,
    } = usePage<AdminSharedProps>().props;
    const currentPath =
        typeof window === 'undefined' ? '/admin' : window.location.pathname;
    const currentType =
        typeof window === 'undefined'
            ? null
            : new URLSearchParams(window.location.search).get('type');

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
                            const [itemPath, itemQuery] = item.href.split('?');
                            const itemType = itemQuery
                                ? new URLSearchParams(itemQuery).get('type')
                                : null;
                            const active =
                                item.href === '/admin'
                                    ? currentPath === '/admin'
                                    : currentPath.startsWith(itemPath) &&
                                      (itemPath !== '/admin/posts' ||
                                          itemType === currentType);
                            return (
                                <Link
                                    key={item.href}
                                    className={active ? 'active' : ''}
                                    href={item.href}
                                    aria-current={active ? 'page' : undefined}
                                    onClick={() => setMenuOpen(false)}
                                    prefetch
                                >
                                    <span aria-hidden="true">{item.icon}</span>
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
                        ↗
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
                        ☰
                    </button>
                    <div>
                        <small>Instituto Azon Social</small>
                        <strong>{title}</strong>
                    </div>
                    <div className="admin-top-actions">
                        <Link href="/" target="_blank">
                            Ver site ↗
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

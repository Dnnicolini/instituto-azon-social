export type AdminIconName =
    | 'calendar'
    | 'external-link'
    | 'file-text'
    | 'files'
    | 'home'
    | 'log-out'
    | 'mail'
    | 'menu'
    | 'play-square'
    | 'settings'
    | 'share-nodes'
    | 'shield-check'
    | 'sprout'
    | 'users';

type AdminIconProps = {
    name: AdminIconName;
};

export function AdminIcon({ name }: AdminIconProps) {
    return (
        <svg
            aria-hidden="true"
            focusable="false"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            {name === 'home' && (
                <>
                    <path d="m3 10 9-7 9 7" />
                    <path d="M5 9v11h14V9" />
                    <path d="M9 20v-6h6v6" />
                </>
            )}
            {name === 'file-text' && (
                <>
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
                    <path d="M14 2v6h6M8 13h8M8 17h6" />
                </>
            )}
            {name === 'play-square' && (
                <>
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <path d="m10 8 6 4-6 4Z" />
                </>
            )}
            {name === 'share-nodes' && (
                <>
                    <circle cx="18" cy="5" r="2.5" />
                    <circle cx="6" cy="12" r="2.5" />
                    <circle cx="18" cy="19" r="2.5" />
                    <path d="m8.2 10.8 7.6-4.5M8.2 13.2l7.6 4.5" />
                </>
            )}
            {name === 'sprout' && (
                <>
                    <path d="M12 22V12" />
                    <path d="M12 14c-4.8 0-8-2.5-8-7 4.8 0 8 2.5 8 7Z" />
                    <path d="M12 11c0-4.6 3.2-7 8-7 0 4.6-3.2 7-8 7Z" />
                </>
            )}
            {name === 'calendar' && (
                <>
                    <rect x="3" y="5" width="18" height="16" rx="2" />
                    <path d="M16 3v4M8 3v4M3 10h18" />
                    <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" />
                </>
            )}
            {name === 'shield-check' && (
                <>
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
                    <path d="m9 12 2 2 4-4" />
                </>
            )}
            {name === 'files' && (
                <>
                    <path d="M15 2H6a2 2 0 0 0-2 2v13" />
                    <rect x="7" y="5" width="13" height="17" rx="2" />
                    <path d="M11 10h5M11 14h5M11 18h3" />
                </>
            )}
            {name === 'mail' && (
                <>
                    <rect x="3" y="5" width="18" height="14" rx="2" />
                    <path d="m3 7 9 6 9-6" />
                </>
            )}
            {name === 'users' && (
                <>
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" />
                </>
            )}
            {name === 'settings' && (
                <>
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z" />
                </>
            )}
            {name === 'log-out' && (
                <>
                    <path d="M10 17l5-5-5-5M15 12H3" />
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                </>
            )}
            {name === 'menu' && <path d="M4 6h16M4 12h16M4 18h16" />}
            {name === 'external-link' && (
                <>
                    <path d="M15 3h6v6M10 14 21 3" />
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                </>
            )}
        </svg>
    );
}

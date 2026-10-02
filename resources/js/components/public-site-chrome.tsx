import { Link, usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';

const focusableSelector = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
].join(',');

function isolateFromBackground(element: HTMLElement) {
    const changed: Array<{ element: HTMLElement; wasInert: boolean }> = [];
    let current: HTMLElement | null = element;

    while (current?.parentElement) {
        for (const sibling of current.parentElement.children) {
            if (sibling === current || !(sibling instanceof HTMLElement)) {
                continue;
            }

            changed.push({ element: sibling, wasInert: sibling.inert });
            sibling.inert = true;
        }

        current = current.parentElement;
    }

    return () => {
        for (const item of changed) {
            item.element.inert = item.wasInert;
        }
    };
}

function activePath(url: string) {
    return url.split(/[?#]/, 1)[0] || '/';
}

export function PublicHeader() {
    const [open, setOpen] = useState(false);
    const { url } = usePage();
    const menuButtonRef = useRef<HTMLButtonElement>(null);
    const navigationRef = useRef<HTMLElement>(null);
    const pathname = activePath(url);

    useEffect(() => {
        if (!open || !navigationRef.current) return;

        const navigation = navigationRef.current;
        const compactNavigation = window.matchMedia('(max-width: 1500px)');
        const restoreBackground = isolateFromBackground(navigation);
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        navigation.querySelector<HTMLElement>(focusableSelector)?.focus();

        function keepFocusInMenu(event: KeyboardEvent) {
            if (event.key === 'Escape') {
                event.preventDefault();
                setOpen(false);
                return;
            }

            if (event.key !== 'Tab') return;

            const focusable = Array.from(
                navigation.querySelectorAll<HTMLElement>(focusableSelector),
            ).filter((element) => !element.hasAttribute('disabled'));
            const first = focusable[0];
            const last = focusable.at(-1);

            if (!first || !last) {
                event.preventDefault();
                navigation.focus();
                return;
            }

            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        }

        document.addEventListener('keydown', keepFocusInMenu);
        compactNavigation.addEventListener('change', closeMenu);

        return () => {
            document.removeEventListener('keydown', keepFocusInMenu);
            compactNavigation.removeEventListener('change', closeMenu);
            restoreBackground();
            document.body.style.overflow = previousOverflow;
            queueMicrotask(() => menuButtonRef.current?.focus());
        };
    }, [open]);

    function closeMenu() {
        setOpen(false);
    }

    return (
        <header className="site-header media-site-header">
            <Link className="brand" href="/">
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
                    <small>Instituto</small>
                </span>
            </Link>
            <button
                className="menu-button"
                type="button"
                aria-expanded={open}
                aria-controls="media-navigation"
                aria-label={open ? 'Fechar menu' : 'Abrir menu'}
                onClick={() => setOpen((value) => !value)}
                ref={menuButtonRef}
            >
                <span />
                <span />
                <span />
            </button>
            <nav
                id="media-navigation"
                className={open ? 'nav open' : 'nav'}
                aria-label="Navegação principal"
                ref={navigationRef}
                tabIndex={-1}
            >
                <Link
                    href="/"
                    aria-current={pathname === '/' ? 'page' : undefined}
                    onClick={closeMenu}
                >
                    Início
                </Link>
                <Link href="/#projetos" onClick={closeMenu}>
                    Projetos
                </Link>
                <Link
                    href="/eventos"
                    aria-current={
                        pathname.startsWith('/eventos') ? 'page' : undefined
                    }
                    onClick={closeMenu}
                >
                    Eventos
                </Link>
                <Link
                    href="/noticias"
                    aria-current={
                        pathname.startsWith('/noticias') ? 'page' : undefined
                    }
                    onClick={closeMenu}
                >
                    Notícias
                </Link>
                <Link
                    href="/calendario"
                    aria-current={
                        pathname === '/calendario' ? 'page' : undefined
                    }
                    onClick={closeMenu}
                >
                    Calendário
                </Link>
                <Link
                    href="/midia"
                    aria-current={
                        pathname.startsWith('/midia') ? 'page' : undefined
                    }
                    onClick={closeMenu}
                >
                    Mídia
                </Link>
                <Link href="/pagina/azon-news" onClick={closeMenu}>
                    Azon News
                </Link>
                <Link href="/pagina/azon-podcast" onClick={closeMenu}>
                    Azon Cast
                </Link>
                <Link href="/pagina/hunkpame-azon-legidan" onClick={closeMenu}>
                    Hunkpame Azon Legidan
                </Link>
                <Link
                    href="/pagina/presente-de-iemanja-sepetiba"
                    onClick={closeMenu}
                >
                    Presente Sepetiba
                </Link>
                <Link
                    className="button button-small"
                    href="/#contato"
                    onClick={closeMenu}
                >
                    Contato
                </Link>
            </nav>
        </header>
    );
}
export function PublicFooter({ children }: { children?: ReactNode }) {
    return (
        <footer className="events-footer">
            <div className="footer-brand">
                <span className="brand-mark">
                    <img
                        src="/azon-social-logo-v2.webp"
                        alt=""
                        width="721"
                        height="721"
                        loading="lazy"
                    />
                </span>
                <div>
                    <strong>Azon Social</strong>
                    <p>Ancestralidade, cuidado e transformação social.</p>
                </div>
            </div>
            <div>
                <strong>Explore</strong>
                <Link href="/noticias">Notícias</Link>
                <Link href="/midia">Mídia</Link>
                <Link href="/eventos">Eventos</Link>
                <Link href="/calendario">Calendário</Link>
            </div>
            <div>
                <strong>Canais e iniciativas</strong>
                <Link href="/pagina/azon-news">Azon News</Link>
                <Link href="/pagina/azon-podcast">Azon Cast</Link>
                <Link href="/pagina/hunkpame-azon-legidan">
                    Hunkpame Azon Legidan
                </Link>
                <Link href="/pagina/presente-de-iemanja-sepetiba">
                    Presente Sepetiba
                </Link>
            </div>
            <div>
                <strong>Contato</strong>
                <a href="mailto:instituto.azonsocial@gmail.com">
                    instituto.azonsocial@gmail.com
                </a>
                <a href="tel:+5521951015058">(21) 95101-5058</a>
                <a
                    href="https://www.instagram.com/azon.social/"
                    target="_blank"
                    rel="noreferrer"
                >
                    @azon.social ↗
                </a>
            </div>
            <p className="copyright">
                © {new Date().getFullYear()} Instituto Azon Social
            </p>
            {children}
        </footer>
    );
}

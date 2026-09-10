import { Link } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { useState } from 'react';
export function PublicHeader() {
    const [open, setOpen] = useState(false);
    return (
        <header className="site-header media-site-header">
            <Link className="brand" href="/">
                <span className="brand-mark">
                    <img
                        src="/azon-social-logo.png"
                        alt=""
                        width="860"
                        height="846"
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
            >
                <span />
                <span />
                <span />
            </button>
            <nav
                id="media-navigation"
                className={open ? 'nav open' : 'nav'}
                aria-label="Navegação principal"
            >
                <Link href="/">Início</Link>
                <Link href="/#projetos">Projetos</Link>
                <Link href="/eventos">Eventos</Link>
                <Link
                    href="/midia"
                    aria-current={
                        typeof window !== 'undefined' &&
                        window.location.pathname.startsWith('/midia')
                            ? 'page'
                            : undefined
                    }
                >
                    Mídia
                </Link>
                <Link className="button button-small" href="/#contato">
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
                        src="/azon-social-logo.png"
                        alt=""
                        width="860"
                        height="846"
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
                <Link href="/midia">Mídia</Link>
                <Link href="/eventos">Eventos</Link>
                <Link href="/#transparencia">Transparência</Link>
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

import { Link } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { SeoHead } from '@/components/seo-head';
import type { SeoData } from '@/types/seo';

export function AuthShell({
    seo,
    children,
}: {
    seo: SeoData;
    children: ReactNode;
}) {
    return (
        <>
            <SeoHead seo={seo} />
            <main className="admin-login-page">
                <section className="admin-login-brand">
                    <Link className="brand admin-brand" href="/">
                        <span className="brand-mark">
                            <img
                                src="/azon-social-logo.webp"
                                alt=""
                                width="941"
                                height="1672"
                            />
                        </span>
                        <span>
                            <strong>Instituto Azon Social</strong>
                            <small>Administração</small>
                        </span>
                    </Link>
                    <div>
                        <p className="eyebrow light">Conteúdo com propósito</p>
                        <h1>
                            O cuidado também está em cada palavra publicada.
                        </h1>
                        <p>
                            Um espaço seguro para manter viva a memória, os
                            projetos e as ações do Instituto.
                        </p>
                    </div>
                    <small>Sepetiba • Rio de Janeiro</small>
                </section>
                <section className="admin-login-form-wrap">{children}</section>
            </main>
        </>
    );
}

import { Link } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { AccessibilityTools } from '@/components/accessibility-tools';
import { PublicFooter, PublicHeader } from '@/components/public-site-chrome';

export function CandidateAuthShell({
    title,
    description,
    children,
}: {
    title: string;
    description: string;
    children: ReactNode;
}) {
    return (
        <>
            <AccessibilityTools />
            <PublicHeader />
            <main
                className="candidate-auth-page"
                id="conteudo-principal"
                tabIndex={-1}
            >
                <section className="candidate-auth-shell">
                    <header>
                        <Link className="text-link" href="/">
                            ← Voltar ao site
                        </Link>
                        <p className="eyebrow">Área do candidato</p>
                        <h1>{title}</h1>
                        <p>{description}</p>
                    </header>
                    {children}
                </section>
            </main>
            <PublicFooter />
        </>
    );
}

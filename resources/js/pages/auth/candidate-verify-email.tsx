import { router, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { CandidateAuthShell } from '@/components/applications/candidate-auth-shell';
import { PublicSeoHead } from '@/components/applications/public-seo-head';
import { candidateStatusMessage } from '@/lib/applications';
import type { PublicPageSeo } from '@/types/applications';

export default function CandidateVerifyEmail({
    seo,
    email,
    status,
}: {
    seo?: PublicPageSeo;
    email?: string | null;
    status?: string;
}) {
    const statusMessage = candidateStatusMessage(status);
    const form = useForm({});

    function resend(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        form.post('/verificar-email/reenviar', { preserveScroll: true });
    }

    return (
        <>
            <PublicSeoHead seo={seo} fallbackTitle="Confirmar e-mail" />
            <CandidateAuthShell
                title="Confirme seu e-mail"
                description="Enviamos um link de confirmação para liberar o acompanhamento das suas inscrições."
            >
                {email && (
                    <p className="candidate-verification-email">
                        Link enviado para <strong>{email}</strong>
                    </p>
                )}
                {statusMessage && (
                    <output className="candidate-auth-status">
                        {statusMessage}
                    </output>
                )}
                <div className="candidate-verification-actions">
                    <form onSubmit={resend}>
                        <button
                            className="button button-gold"
                            type="submit"
                            disabled={form.processing}
                        >
                            {form.processing
                                ? 'Enviando…'
                                : 'Reenviar e-mail de confirmação'}
                        </button>
                    </form>
                    <button
                        className="text-link"
                        type="button"
                        onClick={() => router.post('/sair')}
                    >
                        Sair e usar outra conta
                    </button>
                </div>
            </CandidateAuthShell>
        </>
    );
}

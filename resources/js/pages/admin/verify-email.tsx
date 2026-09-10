import { Link, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { AuthShell } from '@/components/admin/auth-shell';
import type { SeoData } from '@/types/seo';

export default function VerifyEmail({
    seo,
    status,
}: {
    seo: SeoData;
    status?: string;
}) {
    const form = useForm({});
    function submit(event: FormEvent) {
        event.preventDefault();
        form.post('/admin/verificar-email/enviar');
    }
    return (
        <AuthShell seo={seo}>
            <form className="admin-login-form" onSubmit={submit}>
                <div>
                    <p className="eyebrow">Verificação</p>
                    <h2>Confirme seu e-mail</h2>
                    <p>
                        Abra a mensagem enviada para seu e-mail e use o link de
                        verificação antes de acessar o painel.
                    </p>
                </div>
                {status && (
                    <div className="cms-alert success" role="status">
                        {status}
                    </div>
                )}
                <button
                    className="admin-primary-button"
                    type="submit"
                    disabled={form.processing}
                >
                    {form.processing
                        ? 'Reenviando…'
                        : 'Reenviar e-mail de verificação'}
                </button>
                <Link
                    className="auth-back-link"
                    href="/admin/logout"
                    method="post"
                    as="button"
                >
                    Sair
                </Link>
            </form>
        </AuthShell>
    );
}

import { Link, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { AuthShell } from '@/components/admin/auth-shell';
import { FieldError } from '@/components/admin/cms-ui';
import type { SeoData } from '@/types/seo';

export default function ForgotPassword({
    seo,
    status,
}: {
    seo: SeoData;
    status?: string;
}) {
    const form = useForm({ email: '' });
    function submit(event: FormEvent) {
        event.preventDefault();
        form.post('/admin/esqueci-senha');
    }
    return (
        <AuthShell seo={seo}>
            <form className="admin-login-form" onSubmit={submit} noValidate>
                <div>
                    <p className="eyebrow">Recuperar acesso</p>
                    <h2>Redefina sua senha</h2>
                    <p>
                        Enviaremos um link temporário para o e-mail cadastrado.
                    </p>
                </div>
                {status && (
                    <div className="cms-alert success" role="status">
                        {status}
                    </div>
                )}
                <label>
                    E-mail
                    <input
                        autoFocus
                        autoComplete="email"
                        type="email"
                        value={form.data.email}
                        onChange={(event) =>
                            form.setData('email', event.target.value)
                        }
                        aria-invalid={Boolean(form.errors.email)}
                    />
                </label>
                <FieldError message={form.errors.email} />
                <button
                    className="admin-primary-button"
                    type="submit"
                    disabled={form.processing}
                >
                    {form.processing
                        ? 'Enviando…'
                        : 'Enviar link de recuperação'}
                </button>
                <Link className="auth-back-link" href="/admin/login">
                    ← Voltar para o login
                </Link>
            </form>
        </AuthShell>
    );
}

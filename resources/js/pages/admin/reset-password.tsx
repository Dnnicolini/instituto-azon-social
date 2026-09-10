import { useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { AuthShell } from '@/components/admin/auth-shell';
import { FieldError } from '@/components/admin/cms-ui';
import type { SeoData } from '@/types/seo';

export default function ResetPassword({
    seo,
    token,
    email,
}: {
    seo: SeoData;
    token: string;
    email: string;
}) {
    const form = useForm({
        token,
        email,
        password: '',
        password_confirmation: '',
    });
    function submit(event: FormEvent) {
        event.preventDefault();
        form.post('/admin/redefinir-senha', {
            onFinish: () => form.reset('password', 'password_confirmation'),
        });
    }
    return (
        <AuthShell seo={seo}>
            <form className="admin-login-form" onSubmit={submit} noValidate>
                <div>
                    <p className="eyebrow">Nova senha</p>
                    <h2>Proteja seu acesso</h2>
                    <p>
                        Use pelo menos 12 caracteres e evite senhas utilizadas
                        em outros serviços.
                    </p>
                </div>
                <label>
                    E-mail
                    <input
                        autoComplete="email"
                        type="email"
                        value={form.data.email}
                        readOnly
                    />
                </label>
                <FieldError message={form.errors.email} />
                <label>
                    Nova senha
                    <input
                        autoFocus
                        autoComplete="new-password"
                        type="password"
                        value={form.data.password}
                        onChange={(event) =>
                            form.setData('password', event.target.value)
                        }
                        aria-invalid={Boolean(form.errors.password)}
                    />
                </label>
                <FieldError message={form.errors.password} />
                <label>
                    Confirme a nova senha
                    <input
                        autoComplete="new-password"
                        type="password"
                        value={form.data.password_confirmation}
                        onChange={(event) =>
                            form.setData(
                                'password_confirmation',
                                event.target.value,
                            )
                        }
                    />
                </label>
                <button
                    className="admin-primary-button"
                    type="submit"
                    disabled={form.processing}
                >
                    {form.processing ? 'Salvando…' : 'Salvar nova senha'}
                </button>
            </form>
        </AuthShell>
    );
}

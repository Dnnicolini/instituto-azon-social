import { Link, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { AuthShell } from '@/components/admin/auth-shell';
import { FieldError } from '@/components/admin/cms-ui';
import type { SeoData } from '@/types/seo';

export default function Login({
    seo,
    status,
}: {
    seo: SeoData;
    status?: string;
}) {
    const form = useForm({ email: '', password: '', remember: false });
    function submit(event: FormEvent) {
        event.preventDefault();
        form.post('/admin/login', { onFinish: () => form.reset('password') });
    }
    return (
        <AuthShell seo={seo}>
            <form className="admin-login-form" onSubmit={submit} noValidate>
                <div>
                    <p className="eyebrow">Área restrita</p>
                    <h2>Entre no painel</h2>
                    <p>Use seu e-mail institucional para continuar.</p>
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
                        autoComplete="username"
                        type="email"
                        value={form.data.email}
                        onChange={(event) =>
                            form.setData('email', event.target.value)
                        }
                        aria-invalid={Boolean(form.errors.email)}
                    />
                </label>
                <FieldError message={form.errors.email} />
                <label>
                    Senha
                    <input
                        autoComplete="current-password"
                        type="password"
                        value={form.data.password}
                        onChange={(event) =>
                            form.setData('password', event.target.value)
                        }
                        aria-invalid={Boolean(form.errors.password)}
                    />
                </label>
                <FieldError message={form.errors.password} />
                <div className="login-options">
                    <label>
                        <input
                            type="checkbox"
                            checked={form.data.remember}
                            onChange={(event) =>
                                form.setData('remember', event.target.checked)
                            }
                        />{' '}
                        Manter conectado
                    </label>
                    <Link href="/admin/esqueci-senha">Esqueci minha senha</Link>
                </div>
                <button
                    className="admin-primary-button"
                    type="submit"
                    disabled={form.processing}
                >
                    {form.processing ? 'Entrando…' : 'Entrar com segurança'}
                </button>
                <p className="login-security-note">
                    Acesso monitorado. Nunca compartilhe sua senha ou código de
                    verificação.
                </p>
            </form>
        </AuthShell>
    );
}

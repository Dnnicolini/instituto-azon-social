import { Link, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { CandidateAuthShell } from '@/components/applications/candidate-auth-shell';
import { PublicSeoHead } from '@/components/applications/public-seo-head';
import type { PublicPageSeo } from '@/types/applications';

export default function CandidateRegister({ seo }: { seo?: PublicPageSeo }) {
    const form = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        form.post('/cadastro', {
            preserveScroll: true,
            onFinish: () => form.reset('password', 'password_confirmation'),
        });
    }

    return (
        <>
            <PublicSeoHead seo={seo} fallbackTitle="Criar conta" />
            <CandidateAuthShell
                title="Crie sua conta"
                description="Use um e-mail que você acessa. Ele será necessário para confirmar sua conta e acompanhar as inscrições."
            >
                <form
                    className="candidate-auth-form"
                    onSubmit={submit}
                    aria-busy={form.processing}
                >
                    {Object.keys(form.errors).length > 0 && (
                        <div className="application-error-summary" role="alert">
                            Revise os campos indicados para criar sua conta.
                        </div>
                    )}
                    <div className="application-field">
                        <label htmlFor="candidate-name">Nome completo</label>
                        <input
                            id="candidate-name"
                            value={form.data.name}
                            autoComplete="name"
                            required
                            aria-invalid={Boolean(form.errors.name)}
                            onChange={(event) =>
                                form.setData('name', event.currentTarget.value)
                            }
                        />
                        {form.errors.name && (
                            <p className="application-field-error">
                                {form.errors.name}
                            </p>
                        )}
                    </div>
                    <div className="application-field">
                        <label htmlFor="candidate-register-email">E-mail</label>
                        <input
                            id="candidate-register-email"
                            type="email"
                            value={form.data.email}
                            autoComplete="email"
                            required
                            aria-invalid={Boolean(form.errors.email)}
                            onChange={(event) =>
                                form.setData('email', event.currentTarget.value)
                            }
                        />
                        {form.errors.email && (
                            <p className="application-field-error">
                                {form.errors.email}
                            </p>
                        )}
                    </div>
                    <div className="application-field">
                        <label htmlFor="candidate-register-password">
                            Senha
                        </label>
                        <input
                            id="candidate-register-password"
                            type="password"
                            value={form.data.password}
                            autoComplete="new-password"
                            minLength={12}
                            required
                            aria-invalid={Boolean(form.errors.password)}
                            onChange={(event) =>
                                form.setData(
                                    'password',
                                    event.currentTarget.value,
                                )
                            }
                        />
                        <small>
                            Use pelo menos 12 caracteres, com letras, números e
                            símbolo.
                        </small>
                        {form.errors.password && (
                            <p className="application-field-error">
                                {form.errors.password}
                            </p>
                        )}
                    </div>
                    <div className="application-field">
                        <label htmlFor="candidate-password-confirmation">
                            Confirmar senha
                        </label>
                        <input
                            id="candidate-password-confirmation"
                            type="password"
                            value={form.data.password_confirmation}
                            autoComplete="new-password"
                            minLength={12}
                            required
                            aria-invalid={Boolean(
                                form.errors.password_confirmation,
                            )}
                            onChange={(event) =>
                                form.setData(
                                    'password_confirmation',
                                    event.currentTarget.value,
                                )
                            }
                        />
                        {form.errors.password_confirmation && (
                            <p className="application-field-error">
                                {form.errors.password_confirmation}
                            </p>
                        )}
                    </div>
                    <button
                        className="button button-gold"
                        type="submit"
                        disabled={form.processing}
                    >
                        {form.processing ? 'Criando conta…' : 'Criar conta →'}
                    </button>
                </form>
                <p className="candidate-auth-alternative">
                    Já possui acesso? <Link href="/acesso">Entrar</Link>
                </p>
            </CandidateAuthShell>
        </>
    );
}

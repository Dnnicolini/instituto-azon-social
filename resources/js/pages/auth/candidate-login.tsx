import { Link, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { CandidateAuthShell } from '@/components/applications/candidate-auth-shell';
import { PublicSeoHead } from '@/components/applications/public-seo-head';
import { candidateStatusMessage } from '@/lib/applications';
import type { PublicPageSeo } from '@/types/applications';

export default function CandidateLogin({
    seo,
    status,
}: {
    seo?: PublicPageSeo;
    status?: string;
}) {
    const statusMessage = candidateStatusMessage(status);
    const form = useForm({
        email: '',
        password: '',
        remember: false,
    });

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        form.post('/acesso', {
            preserveScroll: true,
            onFinish: () => form.reset('password'),
        });
    }

    return (
        <>
            <PublicSeoHead seo={seo} fallbackTitle="Acessar inscrições" />
            <CandidateAuthShell
                title="Acesse suas inscrições"
                description="Entre para continuar uma candidatura e acompanhar os processos dos quais você participa."
            >
                {statusMessage && (
                    <output className="candidate-auth-status">
                        {statusMessage}
                    </output>
                )}
                <form
                    className="candidate-auth-form"
                    onSubmit={submit}
                    aria-busy={form.processing}
                >
                    {form.errors.email && (
                        <div className="application-error-summary" role="alert">
                            {form.errors.email}
                        </div>
                    )}
                    <div className="application-field">
                        <label htmlFor="candidate-email">E-mail</label>
                        <input
                            id="candidate-email"
                            type="email"
                            value={form.data.email}
                            autoComplete="email"
                            required
                            aria-invalid={Boolean(form.errors.email)}
                            aria-describedby={
                                form.errors.email
                                    ? 'candidate-email-error'
                                    : undefined
                            }
                            onChange={(event) =>
                                form.setData('email', event.currentTarget.value)
                            }
                        />
                        {form.errors.email && (
                            <p
                                className="application-field-error"
                                id="candidate-email-error"
                            >
                                {form.errors.email}
                            </p>
                        )}
                    </div>
                    <div className="application-field">
                        <label htmlFor="candidate-password">Senha</label>
                        <input
                            id="candidate-password"
                            type="password"
                            value={form.data.password}
                            autoComplete="current-password"
                            required
                            aria-invalid={Boolean(form.errors.password)}
                            aria-describedby={
                                form.errors.password
                                    ? 'candidate-password-error'
                                    : undefined
                            }
                            onChange={(event) =>
                                form.setData(
                                    'password',
                                    event.currentTarget.value,
                                )
                            }
                        />
                        {form.errors.password && (
                            <p
                                className="application-field-error"
                                id="candidate-password-error"
                            >
                                {form.errors.password}
                            </p>
                        )}
                    </div>
                    <label className="candidate-remember">
                        <input
                            type="checkbox"
                            checked={form.data.remember}
                            onChange={(event) =>
                                form.setData(
                                    'remember',
                                    event.currentTarget.checked,
                                )
                            }
                        />
                        <span>Manter acesso neste dispositivo</span>
                    </label>
                    <button
                        className="button button-gold"
                        type="submit"
                        disabled={form.processing}
                    >
                        {form.processing ? 'Entrando…' : 'Entrar →'}
                    </button>
                </form>
                <p className="candidate-auth-alternative">
                    Ainda não possui acesso?{' '}
                    <Link href="/cadastro">Criar minha conta</Link>
                </p>
            </CandidateAuthShell>
        </>
    );
}

import { Link, router } from '@inertiajs/react';
import { SeoHead } from '@/components/seo-head';
import type { SeoData } from '@/types/seo';

type AdminLoginPageProps = {
    seo: SeoData;
};

export default function AdminLoginPage({ seo }: AdminLoginPageProps) {
    return (
        <>
            <SeoHead seo={seo} />
            <main className="admin-login-page">
                <section className="admin-login-brand">
                    <Link className="brand admin-brand" href="/">
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
                    <div>
                        <p className="eyebrow light">Área administrativa</p>
                        <h1>O site do Instituto nas suas mãos.</h1>
                        <p>
                            Publique ações, atualize informações e acompanhe
                            todo o conteúdo em um só lugar.
                        </p>
                    </div>
                    <small>
                        Protótipo visual — não conectado a dados reais.
                    </small>
                </section>
                <section className="admin-login-form-wrap">
                    <div className="admin-login-form">
                        <div>
                            <p className="eyebrow">Demonstração visual</p>
                            <h2>Conheça o painel</h2>
                            <p>
                                Explore a interface sem informar e-mail, senha
                                ou qualquer outro dado pessoal.
                            </p>
                        </div>
                        <button
                            className="admin-primary-button"
                            type="button"
                            onClick={() => router.visit('/admin')}
                        >
                            Abrir demonstração
                        </button>
                        <p className="demo-note">
                            Esta tela não possui autenticação nem acesso a
                            informações reais.
                        </p>
                        <Link className="back-site" href="/">
                            ← Voltar ao site
                        </Link>
                    </div>
                </section>
            </main>
        </>
    );
}

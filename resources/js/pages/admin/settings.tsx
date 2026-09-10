import { router, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { AdminLayout } from '@/components/admin/admin-layout';
import { FieldError, PageHeading } from '@/components/admin/cms-ui';
import { SeoHead } from '@/components/seo-head';
import type { AdminSharedProps, SiteSettings } from '@/types/cms';
const labels: Record<
    keyof SiteSettings,
    { label: string; group: string; rows?: number }
> = {
    site_name: { label: 'Nome do Instituto', group: 'Identidade' },
    tagline: { label: 'Frase institucional', group: 'Identidade' },
    description: { label: 'Descrição para buscadores', group: 'SEO', rows: 4 },
    email: { label: 'E-mail público', group: 'Contato' },
    phone: { label: 'Telefone público', group: 'Contato' },
    address: { label: 'Localização', group: 'Contato' },
    hero_title: { label: 'Título da abertura', group: 'Página inicial' },
    hero_emphasis: { label: 'Destaque da abertura', group: 'Página inicial' },
    hero_text: { label: 'Texto da abertura', group: 'Página inicial', rows: 4 },
    founder_name: { label: 'Nome do idealizador', group: 'Idealizador' },
    founder_text: {
        label: 'Apresentação do idealizador',
        group: 'Idealizador',
        rows: 5,
    },
};

type InstagramIntegration = {
    connected: boolean;
    can_connect: boolean;
    username?: string | null;
    last_synced_at?: string | null;
    token_expires_at?: string | null;
    last_error?: string | null;
};

export default function Settings({
    seo,
    settings,
    instagramIntegration,
    errors,
}: AdminSharedProps & {
    settings: SiteSettings;
    instagramIntegration: InstagramIntegration;
    errors?: Record<string, string>;
}) {
    const form = useForm<{ settings: SiteSettings }>({ settings });
    function submit(e: FormEvent) {
        e.preventDefault();
        form.put('/admin/configuracoes');
    }
    const groups = [
        ...new Set(Object.values(labels).map((item) => item.group)),
    ];
    return (
        <>
            <SeoHead seo={seo} />
            <AdminLayout title="Configurações">
                <PageHeading
                    title="Configurações do site"
                    description="Atualize identidade, contato e mensagens centrais do Instituto."
                />
                <section className="cms-form-section instagram-integration">
                    <div>
                        <p className="cms-kicker">Integração automática</p>
                        <h2>Instagram</h2>
                        <p>
                            {instagramIntegration.connected
                                ? `@${instagramIntegration.username ?? 'azon.social'} está conectado. Novas publicações são verificadas automaticamente em intervalos de até dez minutos.`
                                : 'Conecte a conta profissional @azon.social uma única vez. Depois disso, fotos, legendas, datas e links serão sincronizados sem cadastro manual.'}
                        </p>
                    </div>
                    <dl className="instagram-integration-status">
                        <div>
                            <dt>Status</dt>
                            <dd>
                                {instagramIntegration.connected
                                    ? 'Conectado'
                                    : 'Desconectado'}
                            </dd>
                        </div>
                        <div>
                            <dt>Última sincronização</dt>
                            <dd>
                                {instagramIntegration.last_synced_at
                                    ? new Date(
                                          instagramIntegration.last_synced_at,
                                      ).toLocaleString('pt-BR')
                                    : 'Ainda não realizada'}
                            </dd>
                        </div>
                    </dl>
                    {instagramIntegration.last_error && (
                        <p className="cms-alert error" role="alert">
                            A última tentativa falhou. O site preservou as
                            publicações anteriores.
                        </p>
                    )}
                    {errors?.instagram && (
                        <p className="cms-alert error" role="alert">
                            {errors.instagram}
                        </p>
                    )}
                    <div className="instagram-integration-actions">
                        {instagramIntegration.connected ? (
                            <>
                                <button
                                    className="cms-button primary"
                                    type="button"
                                    onClick={() =>
                                        router.post(
                                            '/admin/integracoes/instagram/sincronizar',
                                        )
                                    }
                                >
                                    Sincronizar agora
                                </button>
                                <button
                                    className="cms-button danger"
                                    type="button"
                                    onClick={() => {
                                        if (
                                            confirm(
                                                'Desconectar o Instagram? As publicações já salvas serão mantidas.',
                                            )
                                        ) {
                                            router.delete(
                                                '/admin/integracoes/instagram',
                                            );
                                        }
                                    }}
                                >
                                    Desconectar
                                </button>
                            </>
                        ) : instagramIntegration.can_connect ? (
                            <a
                                className="cms-button primary"
                                href="/admin/integracoes/instagram/conectar"
                            >
                                Conectar @azon.social
                            </a>
                        ) : (
                            <p className="cms-help">
                                Falta cadastrar o aplicativo da Meta no
                                servidor. Consulte as instruções de implantação.
                            </p>
                        )}
                    </div>
                </section>
                <form
                    className="cms-form-single settings-form"
                    onSubmit={submit}
                >
                    {groups.map((group) => (
                        <section className="cms-form-section" key={group}>
                            <h2>{group}</h2>
                            {(Object.keys(labels) as Array<keyof SiteSettings>)
                                .filter((key) => labels[key].group === group)
                                .map((key) => (
                                    <div className="cms-field" key={key}>
                                        <label htmlFor={key}>
                                            {labels[key].label}
                                        </label>
                                        {labels[key].rows ? (
                                            <textarea
                                                id={key}
                                                rows={labels[key].rows}
                                                value={form.data.settings[key]}
                                                onChange={(e) =>
                                                    form.setData('settings', {
                                                        ...form.data.settings,
                                                        [key]: e.target.value,
                                                    })
                                                }
                                            />
                                        ) : (
                                            <input
                                                id={key}
                                                type={
                                                    key === 'email'
                                                        ? 'email'
                                                        : 'text'
                                                }
                                                value={form.data.settings[key]}
                                                onChange={(e) =>
                                                    form.setData('settings', {
                                                        ...form.data.settings,
                                                        [key]: e.target.value,
                                                    })
                                                }
                                            />
                                        )}
                                        <FieldError
                                            message={
                                                form.errors[`settings.${key}`]
                                            }
                                        />
                                    </div>
                                ))}
                        </section>
                    ))}
                    <div className="cms-form-actions">
                        <span>
                            {form.processing
                                ? 'Salvando…'
                                : form.isDirty
                                  ? 'Há alterações não salvas.'
                                  : 'Tudo salvo.'}
                        </span>
                        <button
                            className="cms-button primary"
                            type="submit"
                            disabled={form.processing}
                        >
                            {form.processing
                                ? 'Salvando…'
                                : 'Salvar configurações'}
                        </button>
                    </div>
                </form>
            </AdminLayout>
        </>
    );
}

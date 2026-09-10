import { useForm } from '@inertiajs/react';
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
};
export default function Settings({
    seo,
    settings,
}: AdminSharedProps & { settings: SiteSettings }) {
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

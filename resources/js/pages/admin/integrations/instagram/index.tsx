import { Link, router, useForm } from '@inertiajs/react';
import { type FormEvent, useState } from 'react';
import { AdminLayout } from '@/components/admin/admin-layout';
import { EmptyState, FieldError, PageHeading } from '@/components/admin/cms-ui';
import { useCan } from '@/components/admin/use-can';
import { SeoHead } from '@/components/seo-head';
import type { AdminSharedProps } from '@/types/cms';
import type {
    InstagramAccount,
    InstagramDisplayLocation,
} from '@/types/instagram';

const locationOptions: ReadonlyArray<{
    value: InstagramDisplayLocation;
    label: string;
}> = [
    { value: 'home', label: 'Página inicial' },
    { value: 'social_feed', label: 'Feed geral' },
    { value: 'azon_news', label: 'Azon News' },
    { value: 'azon_cast', label: 'Azon Cast' },
    { value: 'hunkpame', label: 'Hunkpame' },
    { value: 'presente', label: 'Presente' },
];

function formatDate(value?: string | null): string {
    return value
        ? new Date(value).toLocaleString('pt-BR')
        : 'Ainda não realizada';
}

function accountPath(account: InstagramAccount): string {
    return `/admin/integracoes/instagram/${account.id}`;
}

function NewAccountForm({ onCancel }: { onCancel: () => void }) {
    const form = useForm({
        display_name: '',
        expected_username: '',
        description: '',
        group_key: '',
        display_locations: [
            'home',
            'social_feed',
        ] as InstagramDisplayLocation[],
        sort_order: 50,
        enabled: false,
        public_enabled: false,
        auto_publish: false,
    });

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        form.post('/admin/integracoes/instagram', {
            preserveScroll: true,
            onSuccess: onCancel,
        });
    }

    return (
        <form className="cms-form-single" onSubmit={submit}>
            <section className="cms-form-section">
                <h2>Cadastrar perfil profissional</h2>
                <p className="cms-form-section-intro">
                    O cadastro prepara o perfil; a leitura só começa depois da
                    autorização oficial da conta correspondente.
                </p>
                <div className="cms-form-grid two">
                    <div className="cms-field">
                        <label htmlFor="new-instagram-name">
                            Nome de exibição
                        </label>
                        <input
                            id="new-instagram-name"
                            value={form.data.display_name}
                            onChange={(event) =>
                                form.setData('display_name', event.target.value)
                            }
                            autoFocus
                        />
                        <FieldError message={form.errors.display_name} />
                    </div>
                    <div className="cms-field">
                        <label htmlFor="new-instagram-username">
                            Usuário esperado
                        </label>
                        <input
                            id="new-instagram-username"
                            value={form.data.expected_username}
                            onChange={(event) =>
                                form.setData(
                                    'expected_username',
                                    event.target.value,
                                )
                            }
                            placeholder="azon.news"
                        />
                        <FieldError message={form.errors.expected_username} />
                    </div>
                    <div className="cms-field">
                        <label htmlFor="new-instagram-group">
                            Grupo ou iniciativa
                        </label>
                        <input
                            id="new-instagram-group"
                            value={form.data.group_key}
                            onChange={(event) =>
                                form.setData('group_key', event.target.value)
                            }
                            placeholder="presente"
                        />
                        <FieldError message={form.errors.group_key} />
                    </div>
                    <div className="cms-field">
                        <label htmlFor="new-instagram-order">Ordem</label>
                        <input
                            id="new-instagram-order"
                            type="number"
                            min="0"
                            max="9999"
                            value={form.data.sort_order}
                            onChange={(event) =>
                                form.setData(
                                    'sort_order',
                                    Number(event.target.value),
                                )
                            }
                        />
                    </div>
                </div>
                <div className="cms-field">
                    <label htmlFor="new-instagram-description">
                        Descrição curta
                    </label>
                    <textarea
                        id="new-instagram-description"
                        rows={3}
                        value={form.data.description}
                        onChange={(event) =>
                            form.setData('description', event.target.value)
                        }
                    />
                </div>
            </section>
            <div className="cms-form-actions">
                <button
                    className="cms-button secondary"
                    type="button"
                    onClick={onCancel}
                >
                    Cancelar
                </button>
                <button
                    className="cms-button primary"
                    type="submit"
                    disabled={form.processing}
                >
                    {form.processing ? 'Cadastrando…' : 'Cadastrar perfil'}
                </button>
            </div>
        </form>
    );
}

function AccountConfiguration({ account }: { account: InstagramAccount }) {
    const form = useForm({
        display_name: account.display_name,
        expected_username: account.expected_username,
        description: account.description ?? '',
        group_key: account.group_key ?? '',
        display_locations: account.display_locations,
        sort_order: account.sort_order,
        enabled: account.enabled,
        public_enabled: account.public_enabled,
        auto_publish: account.auto_publish,
    });

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (form.processing) return;
        form.patch(accountPath(account), { preserveScroll: true });
    }

    function toggleLocation(
        location: InstagramDisplayLocation,
        checked: boolean,
    ) {
        form.setData(
            'display_locations',
            checked
                ? [...new Set([...form.data.display_locations, location])]
                : form.data.display_locations.filter(
                      (item) => item !== location,
                  ),
        );
    }

    return (
        <form className="cms-form-single" onSubmit={submit}>
            <section className="cms-form-section">
                <h2>Configurar {account.display_name}</h2>
                <p className="cms-form-section-intro">
                    O usuário esperado é conferido quando a Meta retorna a conta
                    autorizada. Alterar o @ não autoriza uma nova conta.
                </p>
                <div className="cms-form-grid two">
                    <div className="cms-field">
                        <label htmlFor={`display-name-${account.id}`}>
                            Nome de exibição
                        </label>
                        <input
                            id={`display-name-${account.id}`}
                            value={form.data.display_name}
                            onChange={(event) =>
                                form.setData('display_name', event.target.value)
                            }
                            aria-invalid={Boolean(form.errors.display_name)}
                        />
                        <FieldError message={form.errors.display_name} />
                    </div>
                    <div className="cms-field">
                        <label htmlFor={`username-${account.id}`}>
                            Usuário esperado
                        </label>
                        <input
                            id={`username-${account.id}`}
                            value={form.data.expected_username}
                            onChange={(event) =>
                                form.setData(
                                    'expected_username',
                                    event.target.value,
                                )
                            }
                            placeholder="azon.social"
                            aria-invalid={Boolean(
                                form.errors.expected_username,
                            )}
                        />
                        <FieldError message={form.errors.expected_username} />
                    </div>
                    <div className="cms-field">
                        <label htmlFor={`group-${account.id}`}>
                            Grupo ou iniciativa
                        </label>
                        <input
                            id={`group-${account.id}`}
                            value={form.data.group_key}
                            onChange={(event) =>
                                form.setData('group_key', event.target.value)
                            }
                            placeholder="Ex.: presente"
                            aria-invalid={Boolean(form.errors.group_key)}
                        />
                        <FieldError message={form.errors.group_key} />
                    </div>
                    <div className="cms-field">
                        <label htmlFor={`sort-order-${account.id}`}>
                            Ordem
                        </label>
                        <input
                            id={`sort-order-${account.id}`}
                            type="number"
                            min="0"
                            max="9999"
                            value={form.data.sort_order}
                            onChange={(event) =>
                                form.setData(
                                    'sort_order',
                                    Number(event.target.value),
                                )
                            }
                            aria-invalid={Boolean(form.errors.sort_order)}
                        />
                        <FieldError message={form.errors.sort_order} />
                    </div>
                </div>
                <div className="cms-field">
                    <label htmlFor={`description-${account.id}`}>
                        Descrição curta
                    </label>
                    <textarea
                        id={`description-${account.id}`}
                        rows={3}
                        value={form.data.description}
                        onChange={(event) =>
                            form.setData('description', event.target.value)
                        }
                        aria-invalid={Boolean(form.errors.description)}
                    />
                    <FieldError message={form.errors.description} />
                </div>
                <fieldset className="cms-source-choice">
                    <legend>Locais de exibição</legend>
                    {locationOptions.map(({ value, label }) => (
                        <label
                            className={
                                form.data.display_locations.includes(value)
                                    ? 'selected'
                                    : undefined
                            }
                            key={value}
                        >
                            <input
                                type="checkbox"
                                checked={form.data.display_locations.includes(
                                    value,
                                )}
                                onChange={(event) =>
                                    toggleLocation(value, event.target.checked)
                                }
                            />
                            <span>
                                <strong>{label}</strong>
                            </span>
                        </label>
                    ))}
                </fieldset>
                <FieldError message={form.errors.display_locations} />
                <div className="cms-social-options">
                    <label className="cms-check-row">
                        <input
                            type="checkbox"
                            checked={form.data.enabled}
                            onChange={(event) =>
                                form.setData('enabled', event.target.checked)
                            }
                        />
                        <span>
                            <strong>Sincronização ativa</strong>
                            <small>
                                Pausar não apaga publicações importadas.
                            </small>
                        </span>
                    </label>
                    <label className="cms-check-row">
                        <input
                            type="checkbox"
                            checked={form.data.public_enabled}
                            onChange={(event) =>
                                form.setData(
                                    'public_enabled',
                                    event.target.checked,
                                )
                            }
                        />
                        <span>
                            <strong>Exibição pública habilitada</strong>
                            <small>
                                A conta pode aparecer nos locais selecionados.
                            </small>
                        </span>
                    </label>
                    <label className="cms-check-row">
                        <input
                            type="checkbox"
                            checked={form.data.auto_publish}
                            onChange={(event) =>
                                form.setData(
                                    'auto_publish',
                                    event.target.checked,
                                )
                            }
                        />
                        <span>
                            <strong>
                                Aprovar novas publicações automaticamente
                            </strong>
                            <small>
                                Desative para revisar cada item antes da
                                exibição.
                            </small>
                        </span>
                    </label>
                </div>
            </section>
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
                    {form.processing ? 'Salvando…' : 'Salvar configurações'}
                </button>
            </div>
        </form>
    );
}

export default function InstagramIntegrations({
    seo,
    accounts,
}: AdminSharedProps & { accounts: InstagramAccount[] }) {
    const canManage = useCan('instagram.manage');
    const canSync = useCan('instagram.sync');
    const [selectedAccountId, setSelectedAccountId] = useState<number | null>(
        null,
    );
    const [pendingAction, setPendingAction] = useState<string | null>(null);
    const [creating, setCreating] = useState(false);
    const selectedAccount =
        accounts.find((account) => account.id === selectedAccountId) ?? null;

    function sync(account: InstagramAccount) {
        const action = `sync-${account.id}`;
        if (pendingAction) return;
        setPendingAction(action);
        router.post(
            `${accountPath(account)}/sincronizar`,
            {},
            {
                preserveScroll: true,
                onFinish: () => setPendingAction(null),
            },
        );
    }

    function toggleEnabled(account: InstagramAccount) {
        const action = `enabled-${account.id}`;
        if (pendingAction) return;
        setPendingAction(action);
        router.patch(
            `${accountPath(account)}/status`,
            { enabled: !account.enabled },
            {
                preserveScroll: true,
                onFinish: () => setPendingAction(null),
            },
        );
    }

    function disconnect(account: InstagramAccount) {
        if (
            pendingAction ||
            !confirm(
                `Remover deste sistema a credencial de @${account.username ?? account.expected_username}? As publicações serão preservadas. Depois, confirme a revogação também na Meta.`,
            )
        )
            return;
        setPendingAction(`disconnect-${account.id}`);
        router.delete(accountPath(account), {
            preserveScroll: true,
            onFinish: () => setPendingAction(null),
        });
    }

    return (
        <>
            <SeoHead seo={seo} />
            <AdminLayout title="Instagram">
                <PageHeading
                    title="Integrações do Instagram"
                    description="Conecte contas profissionais, acompanhe a sincronização e defina como cada perfil aparece no site."
                >
                    {canManage && !creating && (
                        <button
                            className="cms-button primary"
                            type="button"
                            onClick={() => setCreating(true)}
                        >
                            ＋ Cadastrar perfil
                        </button>
                    )}
                </PageHeading>
                {creating && (
                    <NewAccountForm onCancel={() => setCreating(false)} />
                )}
                {accounts.length ? (
                    <div className="cms-table-wrap">
                        <table className="cms-table">
                            <thead>
                                <tr>
                                    <th>Conta</th>
                                    <th>Status</th>
                                    <th>Última sincronização</th>
                                    <th>Importadas</th>
                                    <th>
                                        <span className="sr-only">Ações</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {accounts.map((account) => (
                                    <tr key={account.id}>
                                        <td>
                                            <strong>
                                                {account.display_name}
                                            </strong>
                                            <small>
                                                @
                                                {account.username ??
                                                    account.expected_username}
                                            </small>
                                            {account.last_error && (
                                                <small role="alert">
                                                    Requer atenção: erro na
                                                    última sincronização
                                                </small>
                                            )}
                                        </td>
                                        <td>
                                            <span
                                                className={`cms-status ${account.connected ? 'published' : 'archived'}`}
                                            >
                                                {account.connected
                                                    ? account.enabled
                                                        ? 'Conectada'
                                                        : 'Pausada'
                                                    : 'Desconectada'}
                                            </span>
                                        </td>
                                        <td>
                                            {formatDate(
                                                account.last_success_at,
                                            )}
                                        </td>
                                        <td>{account.imported_count}</td>
                                        <td className="cms-row-actions">
                                            {canManage &&
                                                account.can_connect && (
                                                    <a
                                                        href={`${accountPath(account)}/conectar`}
                                                    >
                                                        {account.connected
                                                            ? 'Reconectar'
                                                            : 'Conectar'}
                                                    </a>
                                                )}
                                            {account.connected && canSync && (
                                                <>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            sync(account)
                                                        }
                                                        disabled={Boolean(
                                                            pendingAction,
                                                        )}
                                                    >
                                                        {pendingAction ===
                                                        `sync-${account.id}`
                                                            ? 'Sincronizando…'
                                                            : 'Sincronizar agora'}
                                                    </button>
                                                </>
                                            )}
                                            {canManage && account.connected && (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        toggleEnabled(account)
                                                    }
                                                    disabled={Boolean(
                                                        pendingAction,
                                                    )}
                                                >
                                                    {account.enabled
                                                        ? 'Pausar'
                                                        : 'Ativar'}
                                                </button>
                                            )}
                                            {canManage && (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setSelectedAccountId(
                                                            account.id,
                                                        )
                                                    }
                                                >
                                                    Editar configurações
                                                </button>
                                            )}
                                            <Link
                                                href={`/admin/posts?type=social&account=${account.id}`}
                                            >
                                                Ver publicações
                                            </Link>
                                            {canManage && account.connected && (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        disconnect(account)
                                                    }
                                                    disabled={Boolean(
                                                        pendingAction,
                                                    )}
                                                >
                                                    Desconectar
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <EmptyState
                        title="Nenhuma conta configurada"
                        description="Cadastre os perfis institucionais no servidor para iniciar as conexões oficiais."
                    />
                )}
                {canManage && selectedAccount && (
                    <AccountConfiguration
                        key={selectedAccount.id}
                        account={selectedAccount}
                    />
                )}
            </AdminLayout>
        </>
    );
}

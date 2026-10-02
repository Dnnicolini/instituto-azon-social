import { type FormEvent, useRef, useState } from 'react';
import { AccessibilityTools } from '@/components/accessibility-tools';
import { PublicFooter, PublicHeader } from '@/components/public-site-chrome';
import { SeoHead } from '@/components/seo-head';
import type {
    InstagramFeedFilters,
    InstagramGroupOption,
    InstagramPublication,
    InstagramPublicationPage,
    PublicInstagramAccount,
} from '@/types/instagram';
import type { SeoData } from '@/types/seo';

type SocialFeedProps = {
    seo: SeoData;
    accounts: PublicInstagramAccount[];
    groups?: InstagramGroupOption[];
    publications: InstagramPublicationPage;
    filters?: InstagramFeedFilters;
    title?: string;
    description?: string;
};

function publicationLabel(publication: InstagramPublication): string {
    const type = publication.provider_media_type?.toUpperCase();
    if (type === 'CAROUSEL_ALBUM') return 'Carrossel';
    if (type === 'VIDEO' || type === 'REEL') return 'Vídeo';
    return 'Imagem';
}

function publicationText(publication: InstagramPublication): string {
    return publication.display_text ?? '';
}

function normalizePage(
    value: InstagramPublicationPage,
): InstagramPublicationPage {
    return {
        data: Array.isArray(value.data) ? value.data : [],
        current_page: Number(value.current_page || 1),
        last_page: Number(value.last_page || 1),
        next_page_url: value.next_page_url ?? null,
        total: value.total,
    };
}

export default function SocialFeed({
    seo,
    accounts,
    groups = [],
    publications,
    filters = {},
    title = 'Acompanhe nossas redes',
    description = 'Publicações dos perfis e iniciativas do Instituto Azon Social.',
}: SocialFeedProps) {
    const initialPage = normalizePage(publications);
    const [items, setItems] = useState(initialPage.data);
    const [page, setPage] = useState(initialPage.current_page);
    const [lastPage, setLastPage] = useState(initialPage.last_page);
    const [account, setAccount] = useState(filters.account ?? '');
    const [group, setGroup] = useState(filters.group ?? '');
    const [appliedFilters, setAppliedFilters] =
        useState<InstagramFeedFilters>(filters);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const requestController = useRef<AbortController | null>(null);

    async function load(
        nextPage: number,
        nextFilters: InstagramFeedFilters,
        append: boolean,
    ) {
        requestController.current?.abort();
        const controller = new AbortController();
        requestController.current = controller;
        setIsLoading(true);
        setError(null);

        const query = new URLSearchParams({ page: String(nextPage) });
        if (nextFilters.account) query.set('account', nextFilters.account);
        if (nextFilters.group) query.set('group', nextFilters.group);

        try {
            const response = await fetch(
                `/api/instagram/publicacoes?${query.toString()}`,
                {
                    headers: { Accept: 'application/json' },
                    signal: controller.signal,
                },
            );
            if (!response.ok)
                throw new Error('Não foi possível atualizar as publicações.');

            const result = normalizePage(
                (await response.json()) as InstagramPublicationPage,
            );
            setItems((current) => {
                if (!append) return result.data;
                const known = new Set(current.map((item) => item.id));
                return [
                    ...current,
                    ...result.data.filter((item) => !known.has(item.id)),
                ];
            });
            setPage(result.current_page);
            setLastPage(result.last_page);
        } catch (reason) {
            if (reason instanceof DOMException && reason.name === 'AbortError')
                return;
            setError(
                reason instanceof Error
                    ? reason.message
                    : 'Não foi possível atualizar as publicações.',
            );
        } finally {
            if (requestController.current === controller) {
                requestController.current = null;
                setIsLoading(false);
            }
        }
    }

    function applyFilters(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const nextFilters = {
            account: account || undefined,
            group: group || undefined,
        };
        setAppliedFilters(nextFilters);
        void load(1, nextFilters, false);
    }

    return (
        <>
            <SeoHead seo={seo} />
            <AccessibilityTools />
            <PublicHeader />
            <main
                className="social-section section"
                id="conteudo-principal"
                tabIndex={-1}
            >
                <header className="social-heading">
                    <div>
                        <p className="eyebrow">Redes sociais</p>
                        <h1>{title}</h1>
                    </div>
                    <div className="social-heading-copy">
                        <p>{description}</p>
                    </div>
                </header>

                <form
                    className="cms-toolbar"
                    onSubmit={applyFilters}
                    aria-label="Filtrar publicações"
                >
                    <div className="cms-form-grid two">
                        <div className="cms-field">
                            <label htmlFor="social-account-filter">
                                Perfil
                            </label>
                            <select
                                id="social-account-filter"
                                value={account}
                                onChange={(event) =>
                                    setAccount(event.target.value)
                                }
                            >
                                <option value="">Todos os perfis</option>
                                {accounts.map((item) => (
                                    <option
                                        key={item.id}
                                        value={String(item.id)}
                                    >
                                        {item.display_name}
                                        {item.username
                                            ? ` (@${item.username})`
                                            : ''}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="cms-field">
                            <label htmlFor="social-group-filter">
                                Iniciativa
                            </label>
                            <select
                                id="social-group-filter"
                                value={group}
                                onChange={(event) =>
                                    setGroup(event.target.value)
                                }
                            >
                                <option value="">Todas as iniciativas</option>
                                {groups.map((item) => (
                                    <option key={item.value} value={item.value}>
                                        {item.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <button
                        className="button button-outline"
                        type="submit"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Atualizando…' : 'Aplicar filtros'}
                    </button>
                </form>

                {error && (
                    <div className="public-empty" role="alert">
                        <h2>Não foi possível carregar o feed</h2>
                        <p>{error}</p>
                        <button
                            className="button button-outline"
                            type="button"
                            onClick={() =>
                                void load(page, appliedFilters, false)
                            }
                            disabled={isLoading}
                        >
                            Tentar novamente
                        </button>
                    </div>
                )}

                {!error && items.length > 0 && (
                    <div className="social-grid" aria-busy={isLoading}>
                        {items.map((publication) => {
                            const username =
                                publication.social_account.username ??
                                publication.social_account.slug;
                            const text = publicationText(publication);
                            return (
                                <article
                                    className="social-card"
                                    key={publication.id}
                                >
                                    <span className="social-card-media">
                                        {publication.cover_url ? (
                                            <img
                                                src={publication.cover_url}
                                                alt={
                                                    publication.title
                                                        ? `Publicação de ${publication.social_account.display_name}: ${publication.title}`
                                                        : `Publicação de ${publication.social_account.display_name}`
                                                }
                                                loading="lazy"
                                            />
                                        ) : (
                                            <span
                                                className="social-card-placeholder"
                                                aria-label="Mídia indisponível"
                                            >
                                                <img
                                                    src="/azon-social-logo-v2.webp"
                                                    alt=""
                                                    width="721"
                                                    height="721"
                                                    loading="lazy"
                                                />
                                            </span>
                                        )}
                                        <span className="social-featured">
                                            {publicationLabel(publication)}
                                        </span>
                                    </span>
                                    <div className="social-card-copy">
                                        <small>
                                            {
                                                publication.social_account
                                                    .display_name
                                            }{' '}
                                            · @{username}
                                        </small>
                                        <strong>
                                            {publication.title ||
                                                `@${username}`}
                                        </strong>
                                        {text && <span>{text}</span>}
                                        <small>
                                            {publication.published_at
                                                ? new Date(
                                                      publication.published_at,
                                                  ).toLocaleDateString('pt-BR')
                                                : 'Data não informada'}{' '}
                                            ·{' '}
                                            {publication.source_type ===
                                            'manual'
                                                ? 'Link cadastrado pela equipe'
                                                : 'Sincronizada do Instagram'}
                                        </small>
                                        {publication.external_url && (
                                            <b>
                                                <a
                                                    href={
                                                        publication.external_url
                                                    }
                                                    target="_blank"
                                                    rel="noreferrer"
                                                >
                                                    Ver no Instagram ↗
                                                </a>
                                            </b>
                                        )}
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}

                {!error && !items.length && !isLoading && (
                    <div className="public-empty" role="status">
                        <h2>Nenhuma publicação encontrada</h2>
                        <p>
                            Ajuste os filtros ou volte em breve para acompanhar
                            novos registros.
                        </p>
                    </div>
                )}

                {isLoading && (
                    <p className="public-empty" role="status">
                        Carregando publicações…
                    </p>
                )}

                {!error && page < lastPage && (
                    <button
                        className="button button-gold"
                        type="button"
                        onClick={() =>
                            void load(page + 1, appliedFilters, true)
                        }
                        disabled={isLoading}
                    >
                        {isLoading ? 'Carregando…' : 'Carregar mais'}
                    </button>
                )}
            </main>
            <PublicFooter />
        </>
    );
}

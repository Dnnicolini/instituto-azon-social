import { useEffect, useRef, useState } from 'react';

type AccessibilityPreferences = {
    fontScale: number;
    highContrast: boolean;
    darkTheme: boolean;
    highlightLinks: boolean;
    readableFont: boolean;
    reduceMotion: boolean;
};

const storageKey = 'azon-accessibility-preferences';
const defaultPreferences: AccessibilityPreferences = {
    fontScale: 1,
    highContrast: false,
    darkTheme: false,
    highlightLinks: false,
    readableFont: false,
    reduceMotion: false,
};

function applyPreferences(preferences: AccessibilityPreferences) {
    const root = document.documentElement;

    root.style.setProperty(
        '--a11y-page-zoom',
        preferences.fontScale.toString(),
    );
    root.toggleAttribute('data-a11y-high-contrast', preferences.highContrast);
    root.toggleAttribute('data-a11y-dark-theme', preferences.darkTheme);
    root.toggleAttribute(
        'data-a11y-highlight-links',
        preferences.highlightLinks,
    );
    root.toggleAttribute('data-a11y-readable-font', preferences.readableFont);
    root.toggleAttribute('data-a11y-reduce-motion', preferences.reduceMotion);
}

export function AccessibilityTools() {
    const [open, setOpen] = useState(false);
    const [speaking, setSpeaking] = useState(false);
    const [status, setStatus] = useState('');
    const [preferences, setPreferences] =
        useState<AccessibilityPreferences>(defaultPreferences);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const panelRef = useRef<HTMLElement>(null);
    const preferencesLoadedRef = useRef(false);

    useEffect(() => {
        try {
            const stored = localStorage.getItem(storageKey);
            if (stored) {
                const parsed = JSON.parse(
                    stored,
                ) as Partial<AccessibilityPreferences>;
                const loaded = { ...defaultPreferences, ...parsed };
                setPreferences(loaded);
                applyPreferences(loaded);
            } else {
                applyPreferences(defaultPreferences);
            }
        } catch {
            applyPreferences(defaultPreferences);
        }

        preferencesLoadedRef.current = true;
    }, []);

    useEffect(() => {
        if (!preferencesLoadedRef.current) return;

        applyPreferences(preferences);
        try {
            localStorage.setItem(storageKey, JSON.stringify(preferences));
        } catch {
            setStatus('As preferências foram aplicadas somente nesta visita.');
        }
    }, [preferences]);

    useEffect(() => {
        if (!open) return;

        const firstButton = panelRef.current?.querySelector('button');
        firstButton?.focus();

        function closeOnEscape(event: KeyboardEvent) {
            if (event.key !== 'Escape') return;
            setOpen(false);
            triggerRef.current?.focus();
        }

        document.addEventListener('keydown', closeOnEscape);
        return () => document.removeEventListener('keydown', closeOnEscape);
    }, [open]);

    useEffect(
        () => () => {
            window.speechSynthesis?.cancel();
        },
        [],
    );

    function updatePreference<K extends keyof AccessibilityPreferences>(
        key: K,
        value: AccessibilityPreferences[K],
        message: string,
    ) {
        setPreferences((current) => ({ ...current, [key]: value }));
        setStatus(message);
    }

    function changeFont(step: number) {
        const nextScale = Math.min(
            1.2,
            Math.max(0.9, Number((preferences.fontScale + step).toFixed(1))),
        );
        updatePreference(
            'fontScale',
            nextScale,
            `Tamanho do conteúdo ajustado para ${Math.round(nextScale * 100)}%.`,
        );
    }

    function toggleSpeech() {
        if (!('speechSynthesis' in window)) {
            setStatus(
                'A leitura em voz alta não é compatível com este navegador.',
            );
            return;
        }

        if (speaking) {
            window.speechSynthesis.cancel();
            setSpeaking(false);
            setStatus('Leitura em voz alta interrompida.');
            return;
        }

        const content = document.getElementById('conteudo-principal');
        const text = content?.innerText.replace(/\s+/g, ' ').trim();
        if (!text) {
            setStatus('Não foi encontrado conteúdo para leitura.');
            return;
        }

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'pt-BR';
        utterance.rate = 0.95;
        utterance.onend = () => setSpeaking(false);
        utterance.onerror = () => {
            setSpeaking(false);
            setStatus('Não foi possível concluir a leitura em voz alta.');
        };
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
        setSpeaking(true);
        setStatus('Leitura em voz alta iniciada.');
    }

    function reset() {
        window.speechSynthesis?.cancel();
        setSpeaking(false);
        setPreferences(defaultPreferences);
        setStatus('Configurações de acessibilidade restauradas.');
    }

    return (
        <>
            <a className="skip-link" href="#conteudo-principal">
                Ir para o conteúdo
            </a>
            <div className="accessibility-tools">
                <button
                    className="accessibility-trigger"
                    type="button"
                    aria-expanded={open}
                    aria-controls="accessibility-panel"
                    onClick={() => setOpen((current) => !current)}
                    ref={triggerRef}
                >
                    <span aria-hidden="true">♿</span>
                    <span>Acessibilidade</span>
                </button>
                {open && (
                    <section
                        className="accessibility-panel"
                        id="accessibility-panel"
                        aria-labelledby="accessibility-panel-title"
                        ref={panelRef}
                    >
                        <div className="accessibility-panel-heading">
                            <h2 id="accessibility-panel-title">
                                Acessibilidade
                            </h2>
                            <button
                                type="button"
                                aria-label="Fechar opções de acessibilidade"
                                onClick={() => {
                                    setOpen(false);
                                    triggerRef.current?.focus();
                                }}
                            >
                                ×
                            </button>
                        </div>
                        <div className="accessibility-font-controls">
                            <button
                                type="button"
                                aria-label="Diminuir tamanho do texto"
                                disabled={preferences.fontScale <= 0.9}
                                onClick={() => changeFont(-0.1)}
                            >
                                A−
                            </button>
                            <span aria-live="polite">
                                {Math.round(preferences.fontScale * 100)}%
                            </span>
                            <button
                                type="button"
                                aria-label="Aumentar tamanho do texto"
                                disabled={preferences.fontScale >= 1.2}
                                onClick={() => changeFont(0.1)}
                            >
                                A+
                            </button>
                        </div>
                        <button
                            type="button"
                            aria-pressed={preferences.highContrast}
                            onClick={() =>
                                updatePreference(
                                    'highContrast',
                                    !preferences.highContrast,
                                    `Alto contraste ${preferences.highContrast ? 'desativado' : 'ativado'}.`,
                                )
                            }
                        >
                            ◐ Alto contraste
                        </button>
                        <button
                            type="button"
                            aria-pressed={preferences.darkTheme}
                            onClick={() =>
                                updatePreference(
                                    'darkTheme',
                                    !preferences.darkTheme,
                                    `Modo escuro ${preferences.darkTheme ? 'desativado' : 'ativado'}.`,
                                )
                            }
                        >
                            ◒ Modo claro/escuro
                        </button>
                        <button
                            type="button"
                            aria-pressed={preferences.highlightLinks}
                            onClick={() =>
                                updatePreference(
                                    'highlightLinks',
                                    !preferences.highlightLinks,
                                    `Destaque de links ${preferences.highlightLinks ? 'desativado' : 'ativado'}.`,
                                )
                            }
                        >
                            ↗ Destacar links
                        </button>
                        <button
                            type="button"
                            aria-pressed={preferences.readableFont}
                            onClick={() =>
                                updatePreference(
                                    'readableFont',
                                    !preferences.readableFont,
                                    `Fonte de fácil leitura ${preferences.readableFont ? 'desativada' : 'ativada'}.`,
                                )
                            }
                        >
                            Aa Fonte de fácil leitura
                        </button>
                        <button
                            type="button"
                            aria-pressed={preferences.reduceMotion}
                            onClick={() =>
                                updatePreference(
                                    'reduceMotion',
                                    !preferences.reduceMotion,
                                    `Animações ${preferences.reduceMotion ? 'reativadas' : 'pausadas'}.`,
                                )
                            }
                        >
                            ‖ Pausar animações
                        </button>
                        <button
                            type="button"
                            aria-pressed={speaking}
                            onClick={toggleSpeech}
                        >
                            {speaking ? '■ Parar leitura' : '▶ Ouvir página'}
                        </button>
                        <button
                            className="accessibility-reset"
                            type="button"
                            onClick={reset}
                        >
                            ↺ Restaurar configurações
                        </button>
                        <p className="sr-only" role="status" aria-live="polite">
                            {status}
                        </p>
                    </section>
                )}
            </div>
        </>
    );
}

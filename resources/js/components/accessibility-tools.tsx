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

const readableSelector = 'h1, h2, h3, h4, p, li, blockquote, figcaption, img';

function normalizeSpeechText(text: string) {
    return text.replace(/\s+/g, ' ').trim();
}

function speechChunks(text: string) {
    const words = normalizeSpeechText(text).slice(0, 30_000).split(' ');
    const chunks: string[] = [];
    let current = '';

    for (const word of words) {
        const candidate = current ? `${current} ${word}` : word;
        if (candidate.length <= 220) {
            current = candidate;
            continue;
        }

        if (current) chunks.push(current);
        current = word;
    }

    if (current) chunks.push(current);

    return chunks;
}

function readableText(element: Element) {
    if (element instanceof HTMLImageElement) {
        return normalizeSpeechText(element.alt);
    }

    return normalizeSpeechText((element as HTMLElement).innerText ?? '');
}

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
    const [pickingAudioTarget, setPickingAudioTarget] = useState(false);
    const [status, setStatus] = useState('');
    const [preferences, setPreferences] =
        useState<AccessibilityPreferences>(defaultPreferences);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const panelRef = useRef<HTMLElement>(null);
    const preferencesLoadedRef = useRef(false);
    const selectedTextRef = useRef('');
    const speechQueueRef = useRef<string[]>([]);
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

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
            if (utteranceRef.current) {
                utteranceRef.current.onend = null;
                utteranceRef.current.onerror = null;
            }
            window.speechSynthesis?.cancel();
        },
        [],
    );

    useEffect(() => {
        function rememberSelection() {
            const selection = window.getSelection();
            const selectedText = normalizeSpeechText(
                selection?.toString() ?? '',
            );
            const content = document.getElementById('conteudo-principal');
            const anchor = selection?.anchorNode;

            if (selectedText && content && anchor && content.contains(anchor)) {
                selectedTextRef.current = selectedText;
            }
        }

        document.addEventListener('selectionchange', rememberSelection);
        return () =>
            document.removeEventListener('selectionchange', rememberSelection);
    }, []);

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

    function stopSpeech(message = 'Leitura em voz alta interrompida.') {
        speechQueueRef.current = [];
        if (utteranceRef.current) {
            utteranceRef.current.onend = null;
            utteranceRef.current.onerror = null;
        }
        utteranceRef.current = null;
        window.speechSynthesis?.cancel();
        setSpeaking(false);
        setStatus(message);
    }

    function speakNextChunk() {
        const speech = window.speechSynthesis;
        const nextChunk = speechQueueRef.current.shift();

        if (!nextChunk) {
            utteranceRef.current = null;
            setSpeaking(false);
            setStatus('Leitura em voz alta concluída.');
            return;
        }

        const utterance = new SpeechSynthesisUtterance(nextChunk);
        const voices = speech.getVoices();
        utterance.lang = 'pt-BR';
        utterance.rate = 0.92;
        utterance.pitch = 1;
        utterance.voice =
            voices.find((voice) => voice.lang.toLowerCase() === 'pt-br') ??
            voices.find((voice) => voice.lang.toLowerCase().startsWith('pt')) ??
            null;
        utterance.onend = speakNextChunk;
        utterance.onerror = (event) => {
            if (event.error === 'canceled' || event.error === 'interrupted') {
                return;
            }

            speechQueueRef.current = [];
            utteranceRef.current = null;
            setSpeaking(false);
            setStatus(
                'O navegador interrompeu a leitura. Toque novamente para continuar.',
            );
        };
        utteranceRef.current = utterance;
        speech.speak(utterance);
        speech.resume();
    }

    function startSpeech(text: string, message: string) {
        if (
            !('speechSynthesis' in window) ||
            !('SpeechSynthesisUtterance' in window)
        ) {
            setStatus(
                'A leitura em voz alta não é compatível com este navegador.',
            );
            return;
        }

        const chunks = speechChunks(text);
        if (!chunks.length) {
            setStatus('Não foi encontrado texto para leitura.');
            return;
        }

        stopSpeech('');
        speechQueueRef.current = chunks;
        setSpeaking(true);
        setStatus(message);
        speakNextChunk();
    }

    function readWholePage() {
        const content = document.getElementById('conteudo-principal');
        startSpeech(
            content?.innerText ?? '',
            'Leitura da página iniciada. Use “Parar leitura” quando quiser.',
        );
    }

    function readSelectedText() {
        if (!selectedTextRef.current) {
            setStatus(
                'Selecione um texto na página e depois toque novamente em “Ouvir texto selecionado”.',
            );
            return;
        }

        startSpeech(
            selectedTextRef.current,
            'Leitura do texto selecionado iniciada.',
        );
    }

    useEffect(() => {
        if (!pickingAudioTarget) return;

        const content = document.getElementById('conteudo-principal');
        document.documentElement.setAttribute('data-audio-picking', '');

        function pickTarget(event: MouseEvent) {
            const target = event.target;
            if (!(target instanceof Element) || !content?.contains(target)) {
                return;
            }

            const readable = target.closest(readableSelector);
            if (!readable || !content.contains(readable)) return;

            const text = readableText(readable);
            if (!text) return;

            event.preventDefault();
            event.stopPropagation();
            setPickingAudioTarget(false);
            startSpeech(text, 'Leitura do trecho escolhido iniciada.');
        }

        function cancelWithKeyboard(event: KeyboardEvent) {
            if (event.key !== 'Escape') return;
            setPickingAudioTarget(false);
            setStatus('Seleção de trecho cancelada.');
            triggerRef.current?.focus();
        }

        document.addEventListener('click', pickTarget, true);
        document.addEventListener('keydown', cancelWithKeyboard);
        return () => {
            document.documentElement.removeAttribute('data-audio-picking');
            document.removeEventListener('click', pickTarget, true);
            document.removeEventListener('keydown', cancelWithKeyboard);
        };
    }, [pickingAudioTarget]);

    function reset() {
        stopSpeech('');
        setPickingAudioTarget(false);
        selectedTextRef.current = '';
        setPreferences(defaultPreferences);
        setStatus('Configurações de acessibilidade restauradas.');
    }

    return (
        <>
            <a className="skip-link" href="#conteudo-principal">
                Ir para o conteúdo
            </a>
            {pickingAudioTarget && (
                <div className="audio-picker-banner" role="status">
                    <span>Toque no texto ou na imagem que deseja ouvir.</span>
                    <button
                        type="button"
                        onClick={() => {
                            setPickingAudioTarget(false);
                            setStatus('Seleção de trecho cancelada.');
                        }}
                    >
                        Cancelar
                    </button>
                </div>
            )}
            <div className="accessibility-tools">
                <button
                    className="accessibility-trigger"
                    type="button"
                    aria-expanded={open}
                    aria-controls="accessibility-panel"
                    onClick={() => setOpen((current) => !current)}
                    ref={triggerRef}
                >
                    <span
                        className="accessibility-trigger-icon"
                        aria-hidden="true"
                    >
                        ♿
                    </span>
                    <span>{speaking ? 'Lendo…' : 'Acessibilidade'}</span>
                </button>
                {open && (
                    <section
                        className="accessibility-panel"
                        id="accessibility-panel"
                        aria-labelledby="accessibility-panel-title"
                        ref={panelRef}
                    >
                        <div className="accessibility-panel-brand">
                            <img
                                src="/azon-social-logo.webp"
                                alt=""
                                width="721"
                                height="721"
                            />
                            <strong>Azon Social</strong>
                        </div>
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
                            className="accessibility-option"
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
                            <span
                                className="accessibility-option-icon"
                                aria-hidden="true"
                            >
                                ◐
                            </span>
                            <span>Alto contraste</span>
                        </button>
                        <button
                            className="accessibility-option"
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
                            <span
                                className="accessibility-option-icon"
                                aria-hidden="true"
                            >
                                ◒
                            </span>
                            <span>Modo claro/escuro</span>
                        </button>
                        <button
                            className="accessibility-option"
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
                            <span
                                className="accessibility-option-icon"
                                aria-hidden="true"
                            >
                                ↗
                            </span>
                            <span>Destacar links</span>
                        </button>
                        <button
                            className="accessibility-option"
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
                            <span
                                className="accessibility-option-icon accessibility-option-icon-text"
                                aria-hidden="true"
                            >
                                Aa
                            </span>
                            <span>Fonte de fácil leitura</span>
                        </button>
                        <button
                            className="accessibility-option"
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
                            <span
                                className="accessibility-option-icon"
                                aria-hidden="true"
                            >
                                Ⅱ
                            </span>
                            <span>Pausar animações</span>
                        </button>
                        <button
                            className="accessibility-option"
                            type="button"
                            aria-pressed={pickingAudioTarget}
                            onClick={() => {
                                setPickingAudioTarget(true);
                                setOpen(false);
                                setStatus(
                                    'Toque no trecho da página que deseja ouvir.',
                                );
                            }}
                        >
                            <span
                                className="accessibility-option-icon"
                                aria-hidden="true"
                            >
                                ⌖
                            </span>
                            <span>Escolher parte para ouvir</span>
                        </button>
                        <button
                            className="accessibility-option"
                            type="button"
                            onClick={readSelectedText}
                        >
                            <span
                                className="accessibility-option-icon"
                                aria-hidden="true"
                            >
                                “”
                            </span>
                            <span>Ouvir texto selecionado</span>
                        </button>
                        <button
                            className="accessibility-option"
                            type="button"
                            onClick={readWholePage}
                        >
                            <span
                                className="accessibility-option-icon"
                                aria-hidden="true"
                            >
                                ▶
                            </span>
                            <span>Ouvir página inteira</span>
                        </button>
                        {speaking && (
                            <button
                                className="accessibility-option accessibility-stop"
                                type="button"
                                onClick={() => stopSpeech()}
                            >
                                <span
                                    className="accessibility-option-icon"
                                    aria-hidden="true"
                                >
                                    ■
                                </span>
                                <span>Parar leitura</span>
                            </button>
                        )}
                        <button
                            className="accessibility-option accessibility-reset"
                            type="button"
                            onClick={reset}
                        >
                            <span
                                className="accessibility-option-icon"
                                aria-hidden="true"
                            >
                                ↺
                            </span>
                            <span>Restaurar configurações</span>
                        </button>
                        {status && (
                            <p
                                className="accessibility-status"
                                role="status"
                                aria-live="polite"
                            >
                                {status}
                            </p>
                        )}
                    </section>
                )}
            </div>
        </>
    );
}

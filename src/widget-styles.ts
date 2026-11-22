export const widgetStyles = `
[data-agbase-widget] {
    --agbase-bg: #080f1d;
    --agbase-surface: #0c1525;
    --agbase-input: #152238;
    --agbase-border: #334864;
    --agbase-text: #edf3ff;
    --agbase-muted: #b5c4dc;
    --agbase-primary: #2861db;
    --agbase-accent: #84b5ff;
    --agbase-composer-padding: 14px;
    color: var(--agbase-text);
    color-scheme: dark;
    font-family: Inter, system-ui, sans-serif;
}

[data-agbase-widget] .agbase-panel {
    right: max(16px, env(safe-area-inset-right));
    bottom: max(16px, env(safe-area-inset-bottom));
    width: min(410px, calc(100vw - 32px));
    height: min(620px, calc(100vh - 32px));
    height: min(620px, calc(100dvh - 32px));
    box-sizing: border-box;
}

[data-agbase-widget] button:focus-visible,
[data-agbase-widget] a:focus-visible,
[data-agbase-widget] input:focus-visible {
    outline: 2px solid var(--agbase-accent);
    outline-offset: 2px;
}

[data-agbase-widget] input::placeholder { color: var(--agbase-muted); }
[data-agbase-widget] button:disabled { opacity: 0.65; }
[data-agbase-widget] button:not(:disabled):hover { filter: brightness(1.1); }

@media (max-width: 400px), (max-height: 480px) {
    [data-agbase-widget] { --agbase-composer-padding: 8px; }
    [data-agbase-widget] .agbase-panel {
        width: min(410px, calc(100vw - 16px));
        right: max(8px, env(safe-area-inset-right));
        bottom: max(8px, env(safe-area-inset-bottom));
        height: min(620px, calc(100dvh - 16px));
    }
}

@media (prefers-reduced-motion: reduce) {
    [data-agbase-widget] .agbase-chat-bubble,
    [data-agbase-widget] .agbase-robot-eye,
    [data-agbase-widget] .agbase-panel,
    .agbase-highlight { animation: none !important; }
}

@keyframes agbase-widget-float {
    0%, 100% {
        transform: translateY(0px);
    }
    50% {
        transform: translateY(-5px);
    }
}

@keyframes agbase-widget-blink {
    0%, 90%, 100% {
        opacity: 1;
    }
    95% {
        opacity: 0.3;
    }
}

@keyframes agbase-widget-fade-in {
    from {
        opacity: 0;
        transform: translateY(10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

[data-agbase-widget] .agbase-chat-bubble {
    animation: agbase-widget-float 2s ease-in-out infinite;
}

[data-agbase-widget] .agbase-robot-eye {
    animation: agbase-widget-blink 3s ease-in-out infinite;
}

[data-agbase-widget] .agbase-markdown-container {
    line-height: 1.7;
}

[data-agbase-widget] .agbase-markdown-container pre {
    overflow-x: auto;
}

[data-agbase-widget] .agbase-markdown-container code {
    font-family: monospace;
}

[data-agbase-widget] .agbase-markdown-container table {
    border-collapse: collapse;
    width: 100%;
}

[data-agbase-widget] .agbase-markdown-container th,
[data-agbase-widget] .agbase-markdown-container td {
    border: 1px solid var(--agbase-border);
    padding: 8px;
}

[data-agbase-widget] .agbase-markdown-container strong {
    font-weight: 700;
    color: var(--agbase-text);
}

[data-agbase-widget] .agbase-markdown-container a {
    color: var(--agbase-accent);
    text-decoration: underline;
}

[data-agbase-widget] .agbase-markdown-container pre {
    white-space: pre-wrap;
    word-wrap: break-word;
}

@keyframes agbase-widget-highlight {
    0% {
        box-shadow: 0 0 0 0 rgba(40,97,219,0.6);
    }
    70% {
        box-shadow: 0 0 0 12px rgba(40,97,219,0);
    }
    100% {
        box-shadow: 0 0 0 0 rgba(40,97,219,0);
    }
}

.agbase-highlight {
    animation: agbase-widget-highlight 1.5s ease-out 2;
    outline: 3px solid #84b5ff;
    border-radius: 8px;
}
`;

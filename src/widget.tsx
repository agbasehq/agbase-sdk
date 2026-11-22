'use client'

import { useState, useRef, useEffect } from "react";
import { useConversation } from "./use-conversation.js";
import { widgetStyles } from "./widget-styles.js";
import { toast, Toaster } from "react-hot-toast";
import ReactMarkdown from 'react-markdown';
import remarkGfm from "remark-gfm";

const pendingHighlightKey = "agbase-widget:pending-highlight";

function highlightElement(id: string) {
    const element = document.getElementById(id);
    if (!element) return;

    element.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
        block: "center",
    });
    element.classList.add("agbase-highlight");
    const timer = window.setTimeout(() => element.classList.remove("agbase-highlight"), 3000);
    return () => {
        window.clearTimeout(timer);
        element.classList.remove("agbase-highlight");
    };
}

export default function ChatWidget({
    name = 'Assistant',
    appKey
}: {
    name?: string,
    appKey: string
}) {

    const [openChatBubble, setOpenChatBubble] =
        useState<boolean>(false);

    const {
        input, setInput, messages, isTyping, statusText,
        selectedFile, setSelectedFile, sendMessage,
    } = useConversation(appKey);

    const [zoomedImage, setZoomedImage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    const clearHighlight = useRef<(() => void) | undefined>(undefined);
    const launcherRef = useRef<HTMLButtonElement>(null);
    const composerRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        try {
            const entry = window.sessionStorage.getItem(pendingHighlightKey);
            if (entry) {
                window.sessionStorage.removeItem(pendingHighlightKey);
                const [url, id, expires] = JSON.parse(entry) as [string, string, number];
                if (url === window.location.href && Date.now() < expires) {
                    clearHighlight.current = highlightElement(id);
                }
            }
        } catch {
            // Storage may be unavailable in an embedded or private browser context.
        }
        return () => clearHighlight.current?.();
    }, []);

    function navigateAndHighlight(route?: string | null, elementId?: string | null) {
        if (route) {
            let destination: URL;
            try {
                destination = new URL(route, window.location.href);
            } catch {
                return;
            }
            if (destination.origin !== window.location.origin ||
                !["https:", "http:"].includes(destination.protocol)) return;

            if (destination.href !== window.location.href) {
                if (elementId) {
                    try {
                        window.sessionStorage.setItem(pendingHighlightKey, JSON.stringify([
                            destination.href, elementId, Date.now() + 10000,
                        ]));
                    } catch {
                        // Navigation still works when storage is unavailable.
                    }
                }
                window.location.assign(destination.href);
                return;
            }
        }

        if (elementId) {
            clearHighlight.current?.();
            clearHighlight.current = highlightElement(elementId);
        }
    }

    useEffect(() => {
        if (openChatBubble) composerRef.current?.focus();
    }, [openChatBubble]);

    function closeChat() {
        setOpenChatBubble(false);
        requestAnimationFrame(() => launcherRef.current?.focus());
    }

    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [messages, isTyping, openChatBubble]);

    const btnPrimary = {
        backgroundColor: 'var(--agbase-primary)',
        color: 'white',
        padding: '8px 14px',
        borderRadius: '8px',
        fontSize: '13px',
        fontWeight: 500,
        border: 'none',
        cursor: 'pointer'
    };

    const btnSecondary = {
        backgroundColor: 'var(--agbase-input)',
        color: 'var(--agbase-accent)',
        padding: '8px 14px',
        borderRadius: '8px',
        fontSize: '13px',
        fontWeight: 500,
        border: '1px solid var(--agbase-border)',
        cursor: 'pointer'
    };

    return (
        <div data-agbase-widget>

            <Toaster
                position="top-center"
                reverseOrder={false}
            />

            <style>{widgetStyles}</style>

            {zoomedImage && (
                <div
                    role="dialog"
                    aria-label="Image preview"
                    aria-modal="true"
                    onKeyDown={event => { if (event.key === "Escape") setZoomedImage(null); }}
                    onClick={() => setZoomedImage(null)}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        backdropFilter: 'blur(5px)',
                        zIndex: 20000,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'zoom-out',
                        padding: '20px'
                    }}
                >
                    <button type="button" aria-label="Close image preview" autoFocus
                        style={{
                            position: 'absolute',
                            top: '20px',
                            right: '20px',
                            background: '#fff',
                            border: 'none',
                            borderRadius: '50%',
                            width: '40px',
                            height: '40px',
                            cursor: 'pointer',
                            fontSize: '20px'
                        }}
                    >
                        ✕
                    </button>

                    <img
                        src={zoomedImage}
                        alt="Zoomed reference"
                        style={{
                            maxWidth: '100%',
                            maxHeight: '90vh',
                            borderRadius: '8px',
                            boxShadow:
                                '0 0 30px rgba(0,0,0,0.5)'
                        }}
                    />
                </div>
            )}

            {!openChatBubble && (
                <button
                    type="button"
                    ref={launcherRef}
                    aria-label="Open chat"
                    className="agbase-launcher"
                    onClick={() => setOpenChatBubble(true)}
                    style={{
                        position: 'fixed', bottom: 20, right: 20, zIndex: 9999,
                        background: 'none', border: 0, padding: 0, cursor: 'pointer',
                        filter: 'drop-shadow(0px 4px 12px rgba(0, 0, 0, 0.15))',
                    }}
                >
                    <svg aria-hidden="true" width="60" height="60" viewBox="0 0 60 60" fill="none">
                        <g className="agbase-chat-bubble">
                            <ellipse cx="30" cy="52" rx="15" ry="3" fill="#000" opacity="0.1" />
                            <path d="M45 15C45 8.37258 39.6274 3 33 3H15C8.37258 3 3 8.37258 3 15V33C3 39.6274 8.37258 45 15 45H18V52L26 45H33C39.6274 45 45 39.6274 45 33V15Z" fill="var(--agbase-primary)" />
                            <g transform="translate(12, 14)">
                                <line x1="12" y1="0" x2="12" y2="3" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                                <circle cx="12" cy="0" r="1.5" fill="white" />
                                <rect x="6" y="3" width="12" height="10" rx="2" fill="white" />
                                <circle className="agbase-robot-eye" cx="9.5" cy="8" r="1.5" fill="var(--agbase-primary)" />
                                <circle className="agbase-robot-eye" cx="14.5" cy="8" r="1.5" fill="var(--agbase-primary)" />
                                <line x1="9" y1="11" x2="15" y2="11" stroke="var(--agbase-primary)" strokeWidth="1" strokeLinecap="round" />
                                <rect x="7" y="14" width="10" height="6" rx="1" fill="white" />
                                <rect x="4" y="15" width="2" height="4" rx="1" fill="white" />
                                <rect x="18" y="15" width="2" height="4" rx="1" fill="white" />
                            </g>
                        </g>
                    </svg>
                </button>
            )}

            {openChatBubble && (

                <div
                    className="agbase-panel"
                    role="region"
                    aria-label={name}
                    onKeyDown={(event) => {
                        if (event.key === "Escape") closeChat();
                    }}
                    style={{
                        position: 'fixed',
                        backgroundColor: 'var(--agbase-surface)',
                        boxShadow:
                            '0 18px 42px rgb(0 0 0 / 35%)',
                        borderRadius: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        zIndex: 10000,
                        overflow: 'hidden',
                        border: '1px solid var(--agbase-border)',
                        animation: 'agbase-widget-fade-in 0.2s ease-out'
                    }}
                >

                    {/* HEADER */}

                    <div
                        style={{
                            backgroundColor: "var(--agbase-surface)",
                            borderBottom: "1px solid var(--agbase-border)",
                            padding: '14px 18px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            color: '#fff'
                        }}
                    >

                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px'
                            }}
                        >

                            <div
                                style={{
                                    width: '8px',
                                    height: '8px',
                                    backgroundColor: 'var(--agbase-accent)',
                                    borderRadius: '50%',
                                }}
                            />

                            <span
                                style={{
                                    fontWeight: 600,
                                    fontSize: '15px'
                                }}
                            >
                                {name}
                            </span>
                        </div>

                        <button
                            type="button"
                            style={{
                                cursor: 'pointer',
                                background: 'transparent',
                                color: 'inherit',
                                border: 0,
                                fontSize: '18px',
                                opacity: 0.8
                            }}
                            onClick={closeChat}
                            aria-label="Close chat"
                        >
                            ✕
                        </button>
                    </div>

                    {/* MESSAGES */}

                    <div
                        ref={scrollRef}
                        style={{
                            flex: 1,
                            overflowY: 'auto',
                            padding: '16px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px',
                            backgroundColor: 'var(--agbase-bg)',
                            overscrollBehavior: 'contain'
                        }}
                    >

                        {messages.map((msg) => (

                            <div
                                key={msg.id}
                                style={{
                                    alignSelf:
                                        msg.role === 'user'
                                            ? 'flex-end'
                                            : 'flex-start',
                                    maxWidth: '90%',
                                    minWidth: 0,
                                    overflowWrap: 'anywhere',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '4px'
                                }}
                            >

                                <div
                                    style={{
                                        backgroundColor:
                                            msg.role === 'user'
                                                ? 'var(--agbase-primary)'
                                                : 'var(--agbase-surface)',

                                        color:
                                            msg.role === 'user'
                                                ? '#fff'
                                                : 'var(--agbase-text)',

                                        padding: '12px 16px',
                                        borderRadius: '12px',
                                        fontSize: '14px',

                                        border:
                                            msg.role === 'user'
                                                ? 'none'
                                                : '1px solid var(--agbase-border)',


                                    }}
                                >

                                    {msg.image && (
                                        <div
                                            style={{
                                                marginBottom: '10px'
                                            }}
                                        >
                                            <img
                                                src={msg.image}
                                                alt="Reference"
                                                onClick={() =>
                                                    setZoomedImage(msg.image!)
                                                }
                                                style={{
                                                    width: '100%',
                                                    borderRadius: '8px',
                                                    cursor: 'zoom-in'
                                                }}
                                            />
                                        </div>
                                    )}

                                    {msg.role === 'assistant' ? (

                                        <div className="agbase-markdown-container">

                                            <ReactMarkdown
                                                remarkPlugins={[remarkGfm]}
                                                components={{
                                                    code(props) {
                                                        const { children, className } = props;

                                                        const isInline =
                                                            !className?.includes("language-");

                                                        if (isInline) {
                                                            return (
                                                                <code
                                                                    style={{
                                                                        background: "var(--agbase-input)",
                                                                        color: "var(--agbase-accent)",
                                                                        padding: "2px 6px",
                                                                        borderRadius: "6px",
                                                                        fontSize: "13px",
                                                                        fontFamily: "monospace",
                                                                    }}
                                                                >
                                                                    {children}
                                                                </code>
                                                            );
                                                        }

                                                        return (
                                                            <pre
                                                                style={{
                                                                    background: "var(--agbase-bg)",
                                                                    color: "var(--agbase-text)",
                                                                    padding: "14px",
                                                                    borderRadius: "10px",
                                                                    overflowX: "auto",
                                                                    marginTop: "10px",
                                                                    marginBottom: "10px",
                                                                    fontSize: "13px",
                                                                    lineHeight: 1.6,
                                                                }}
                                                            >
                                                                <code>{children}</code>
                                                            </pre>
                                                        );
                                                    },

                                                    p(props) {
                                                        return (
                                                            <p
                                                                style={{
                                                                    marginTop: "8px",
                                                                    marginBottom: "8px",
                                                                    lineHeight: 1.7,
                                                                }}
                                                            >
                                                                {props.children}
                                                            </p>
                                                        );
                                                    },

                                                    ul(props) {
                                                        return (
                                                            <ul
                                                                style={{
                                                                    paddingLeft: "20px",
                                                                    marginTop: "10px",
                                                                    marginBottom: "10px",
                                                                }}
                                                            >
                                                                {props.children}
                                                            </ul>
                                                        );
                                                    },

                                                    ol(props) {
                                                        return (
                                                            <ol
                                                                style={{
                                                                    paddingLeft: "20px",
                                                                    marginTop: "10px",
                                                                    marginBottom: "10px",
                                                                }}
                                                            >
                                                                {props.children}
                                                            </ol>
                                                        );
                                                    },

                                                    li(props) {
                                                        return (
                                                            <li
                                                                style={{
                                                                    marginBottom: "6px",
                                                                    lineHeight: 1.6,
                                                                }}
                                                            >
                                                                {props.children}
                                                            </li>
                                                        );
                                                    },

                                                    h1(props) {
                                                        return (
                                                            <h1
                                                                style={{
                                                                    fontSize: "22px",
                                                                    fontWeight: 700,
                                                                    marginTop: "16px",
                                                                    marginBottom: "10px",
                                                                    color: "var(--agbase-text)",
                                                                }}
                                                            >
                                                                {props.children}
                                                            </h1>
                                                        );
                                                    },

                                                    h2(props) {
                                                        return (
                                                            <h2
                                                                style={{
                                                                    fontSize: "18px",
                                                                    fontWeight: 700,
                                                                    marginTop: "14px",
                                                                    marginBottom: "8px",
                                                                    color: "var(--agbase-text)",
                                                                }}
                                                            >
                                                                {props.children}
                                                            </h2>
                                                        );
                                                    },

                                                    h3(props) {
                                                        return (
                                                            <h3
                                                                style={{
                                                                    fontSize: "16px",
                                                                    fontWeight: 600,
                                                                    marginTop: "12px",
                                                                    marginBottom: "6px",
                                                                    color: "var(--agbase-text)",
                                                                }}
                                                            >
                                                                {props.children}
                                                            </h3>
                                                        );
                                                    },

                                                    a(props) {
                                                        return (
                                                            <a
                                                                href={props.href}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                style={{
                                                                    color: "var(--agbase-accent)",
                                                                    textDecoration: "underline",
                                                                    fontWeight: 500,
                                                                }}
                                                            >
                                                                {props.children}
                                                            </a>
                                                        );
                                                    },

                                                    blockquote(props) {
                                                        return (
                                                            <blockquote
                                                                style={{
                                                                    borderLeft: "4px solid var(--agbase-accent)",
                                                                    paddingLeft: "12px",
                                                                    marginLeft: 0,
                                                                    color: "var(--agbase-muted)",
                                                                    fontStyle: "italic",
                                                                    marginTop: "10px",
                                                                    marginBottom: "10px",
                                                                }}
                                                            >
                                                                {props.children}
                                                            </blockquote>
                                                        );
                                                    },
                                                }}
                                            >
                                                {msg.content}
                                            </ReactMarkdown>

                                            {(msg.route || msg.elementId) && (

                                                <div
                                                    style={{
                                                        marginTop: '12px',
                                                        borderTop:
                                                            '1px solid var(--agbase-border)',

                                                        paddingTop: '10px',

                                                        display: 'flex',

                                                        gap: '8px',

                                                        flexWrap: 'wrap'
                                                    }}
                                                >

                                                    {msg.route && (

                                                        <button type="button"
                                                            onClick={() =>
                                                                window.location.href =
                                                                msg.route!
                                                            }
                                                            style={btnPrimary}
                                                        >
                                                            Explore Page
                                                        </button>
                                                    )}

                                                    {msg.elementId && (

                                                        <button type="button"
                                                            onClick={() =>
                                                                navigateAndHighlight(
                                                                    msg.route,
                                                                    msg.elementId
                                                                )
                                                            }
                                                            style={btnSecondary}
                                                        >
                                                            View
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                    ) : (

                                        <div
                                            style={{
                                                whiteSpace: 'pre-wrap'
                                            }}
                                        >
                                            {msg.content}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}

                        {isTyping && (
                            <div
                                role="status"
                                style={{
                                    fontSize: '12px',
                                    color: 'var(--agbase-muted)',
                                    marginLeft: '4px'
                                }}
                            >
                                {statusText ||
                                    `${name} is thinking...`}
                            </div>
                        )}
                    </div>

                    {/* INPUT */}

                    <div
                        style={{
                            padding: 'var(--agbase-composer-padding)',
                            borderTop: '1px solid var(--agbase-border)',
                            backgroundColor: 'var(--agbase-surface)'
                        }}
                    >

                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                backgroundColor: 'var(--agbase-input)',
                                padding: '6px 14px',
                                borderRadius: '12px',
                                border: '1px solid var(--agbase-border)'
                            }}
                        >

                            <button type="button"
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: '4px',
                                    display: 'flex'
                                }}
                                aria-label="Attach image"
                                onClick={() =>
                                    fileInputRef.current?.click()
                                }
                            >

                                <svg
                                    width="20"
                                    height="20"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="var(--agbase-muted)"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <rect
                                        x="3"
                                        y="3"
                                        width="18"
                                        height="18"
                                        rx="2"
                                        ry="2"
                                    />

                                    <circle
                                        cx="8.5"
                                        cy="8.5"
                                        r="1.5"
                                    />

                                    <polyline
                                        points="21 15 16 10 5 21"
                                    />
                                </svg>

                                <input
                                    type="file"
                                    accept="image/*"
                                    ref={fileInputRef}
                                    style={{ display: 'none' }}
                                    onChange={(e) => {

                                        const file =
                                            e.target.files?.[0];

                                        e.currentTarget.value = "";
                                        if (file) {
                                            setSelectedFile(file);

                                            toast.success(
                                                `Attached: ${file.name}`
                                            );
                                        }
                                    }}
                                />
                            </button>

                            {selectedFile && (
                                <div
                                    style={{
                                        fontSize: '11px',
                                        color: 'var(--agbase-accent)',
                                        maxWidth: '80px',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap'
                                    }}
                                >
                                    📎 {selectedFile.name}
                                </div>
                            )}

                            <input
                                type="text"
                                ref={composerRef}
                                value={input}
                                onChange={(e) =>
                                    setInput(e.target.value)
                                }
                                onKeyDown={(e) =>
                                    e.key === 'Enter' && !e.nativeEvent.isComposing &&
                                    sendMessage()
                                }
                                aria-label="Message"
                                placeholder="Type a message..."
                                style={{
                                    flex: 1,
                                    minWidth: 0,
                                    border: 'none',
                                    background: 'none',
                                    padding: '10px 0',
                                    fontSize: '16px',
                                    color: 'var(--agbase-text)'
                                }}
                            />

                            <button type="button"
                                aria-label="Send message"
                                onClick={sendMessage}
                                disabled={
                                    (!input.trim() &&
                                        !selectedFile) ||
                                    isTyping
                                }
                                style={{
                                    background:
                                        (input.trim() ||
                                            selectedFile) &&
                                            !isTyping
                                            ? 'var(--agbase-primary)'
                                            : 'transparent',

                                    border: 'none',

                                    borderRadius: '50%',

                                    width: '34px',

                                    height: '34px',

                                    display: 'flex',

                                    alignItems: 'center',

                                    justifyContent: 'center',

                                    cursor:
                                        (input.trim() ||
                                            selectedFile) &&
                                            !isTyping
                                            ? 'pointer'
                                            : 'default',

                                    transition: 'all 0.2s'
                                }}
                            >

                                <svg
                                    width="18"
                                    height="18"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke={
                                        (input.trim() ||
                                            selectedFile) &&
                                            !isTyping
                                            ? "#fff"
                                            : "var(--agbase-muted)"
                                    }
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <line
                                        x1="22"
                                        y1="2"
                                        x2="11"
                                        y2="13"
                                    />

                                    <polyline
                                        points="22 2 15 22 11 13 2 9 22 2"
                                    />
                                </svg>
                            </button>
                        </div>

                        <div
                            style={{
                                textAlign: 'center',
                                fontSize: '11px',
                                color: 'var(--agbase-muted)',
                                marginTop: '10px'
                            }}
                        >
                            Powered by <strong>AGBase</strong>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
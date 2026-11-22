import React from "react";
import { createRoot } from "react-dom/client";
import ChatWidget from "./widget.js";

if (typeof document !== "undefined") {
    const currentScript = document.currentScript;
    const init = () => {
        if (document.getElementById("agbase-ai-root")) return;

        // Module scripts have no currentScript. Preserve the existing attribute lookup there.
        const scripts = document.querySelectorAll("script[data-app-key]");
        const script = currentScript ?? scripts[scripts.length - 1];
        const appKey = script?.getAttribute("data-app-key");
        if (!appKey) return;

        const container = document.createElement("div");
        container.id = "agbase-ai-root";
        document.body.appendChild(container);

        const root = createRoot(container);
        root.render(React.createElement(ChatWidget, {
            appKey,
            name: script?.getAttribute("data-name") || "Assistant",
        }));

        const observer = new MutationObserver(() => {
            if (container.isConnected) return;
            observer.disconnect();
            root.unmount();
        });
        observer.observe(document.documentElement, { childList: true, subtree: true });
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init, { once: true });
    } else {
        init();
    }
}

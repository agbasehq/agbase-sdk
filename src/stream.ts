export async function* readEventData(body: ReadableStream<Uint8Array>, signal: AbortSignal) {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let data: string[] = [];
    const cancel = () => { void reader.cancel().catch(() => {}); };

    signal.addEventListener("abort", cancel, { once: true });
    try {
        while (!signal.aborted) {
            const { done, value } = await reader.read();
            buffer += done ? decoder.decode() : decoder.decode(value, { stream: true });

            let newline = buffer.search(/[\r\n]/);
            while (newline !== -1) {
                if (!done && buffer[newline] === "\r" && newline === buffer.length - 1) break;

                const line = buffer.slice(0, newline);
                const delimiterLength = buffer.slice(newline, newline + 2) === "\r\n" ? 2 : 1;
                buffer = buffer.slice(newline + delimiterLength);

                if (line.startsWith("data:")) {
                    data.push(line.slice(5).replace(/^ /, ""));
                } else if (!line && data.length) {
                    yield data.join("\n");
                    data = [];
                }
                newline = buffer.search(/[\r\n]/);
            }
            if (done) break;
        }
    } finally {
        signal.removeEventListener("abort", cancel);
        cancel();
        reader.releaseLock();
    }
}

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { AGBaseClient } from "./client.js";

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    image?: string;
    route?: string | null;
    elementId?: string | null;
}

export function useConversation(appKey: string) {
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState<Message[]>([
        { id: "welcome", role: "assistant", content: "Hello! How can I help you today?" },
    ]);
    const [isTyping, setIsTyping] = useState(false);
    const [statusText, setStatusText] = useState("");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const currentRequest = useRef<AbortController | null>(null);
    const nextId = useRef(0);
    const client = useMemo(() => new AGBaseClient({ appKey }), [appKey]);

    useEffect(() => () => {
        currentRequest.current?.abort();
        currentRequest.current = null;
    }, []);

    const sendMessage = async () => {
        const query = input.trim();
        if ((!query && !selectedFile) || currentRequest.current) return;

        const request = new AbortController();
        currentRequest.current = request;
        const userId = String(++nextId.current);
        const assistantId = String(++nextId.current);

        setInput("");
        setSelectedFile(null);
        setMessages(previous => [
            ...previous,
            { id: userId, role: "user", content: query },
            { id: assistantId, role: "assistant", content: "" },
        ]);
        setIsTyping(true);

        function updateReply(update: (message: Message) => Message) {
            if (currentRequest.current !== request) return;
            setMessages(previous => previous.map(message =>
                message.id === assistantId ? update(message) : message,
            ));
        }

        try {
            await client.ask({
                query,
                signal: request.signal,
                ...(selectedFile ? { file: selectedFile } : {}),
                onStatus(message) {
                    if (currentRequest.current === request) setStatusText(message);
                },
                onText(chunk) {
                    updateReply(message => ({ ...message, content: message.content + chunk }));
                },
                onMeta(meta) {
                    updateReply(message => ({ ...message, ...meta }));
                },
                onError(message) {
                    if (currentRequest.current !== request) return;
                    toast.error(message);
                    updateReply(reply => ({
                        ...reply,
                        content: reply.content ? reply.content + "\n\n" + message : message,
                    }));
                },
            });
        } finally {
            if (currentRequest.current === request) {
                currentRequest.current = null;
                setIsTyping(false);
                setStatusText("");
            }
        }
    };

    return { input, setInput, messages, isTyping, statusText, selectedFile, setSelectedFile, sendMessage };
}

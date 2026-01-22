import { Message } from "@/types/chat";

interface ChatStreamProps {
    messages: Message[];
    origin: string;
    token: string;
    onChunk: (text: string, done: boolean) => void;
}

export async function chatStream({
    messages,
    origin,
    token,
    onChunk,
}: ChatStreamProps) {
    const response = await fetch("/api/chat", {
        method: "POST",
        body: JSON.stringify({ messages, origin, token }),
    });

    if (!response.ok || !response.body) {
        throw new Error("Failed to fetch chat stream");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    let accumulated = "";

    while (true) {
        const { value, done } = await reader.read();
        if (done) {
            onChunk(accumulated, true);
            break;
        }

        const chunk = decoder.decode(value, { stream: true });
        accumulated += chunk;

        // 🔥 push partial text
        onChunk(accumulated, false);
    }
}

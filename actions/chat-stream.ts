import { ChatType, Message } from "@/types/chat";

interface ChatStreamProps {
  chatType: ChatType;
  messages: Message[];
  origin: string;
  token: string;
  onChunk: (text: string, done: boolean) => void;
}

export async function chatStream({
  chatType,
  messages,
  origin,
  token,
  onChunk,
}: ChatStreamProps) {
  const endpoint =
    chatType === "CHAT" ? "openrouter/deepseek" : "openrouter/gpt-mini";
  const response = await fetch(`/api/chat/${endpoint}`, {
    method: "POST",
    body: JSON.stringify({ messages, origin, token }),
  });

  if (!response.ok || !response.body) {
    console.log(response);
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

import { ChatType, Message } from "@/types/chat";

interface ChatStreamProps {
  chatType: ChatType;
  messages: Message[];
  origin: string;
  token: string;
  role?: string;
  onChunk: (text: string, done: boolean) => void;
}

export async function chatStream({
  messages,
  origin,
  token,
  role,
  onChunk,
}: ChatStreamProps) {

  const response = await fetch(`/api/chat/gpt`, {
    method: "POST",
    body: JSON.stringify({ messages, origin, token, role }),
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

"use client";

import { VoiceAgentChat } from "@/components/voice/voice-agent-chat";
import { useSearchParams } from "next/navigation";

export function VoiceAgentHomeClient() {
  const searchParams = useSearchParams();
  const threadId = searchParams.get("thread")?.trim();
  const title = searchParams.get("title")?.trim();
  const token = process.env.NEXT_PUBLIC_DEV_LMS_TOKEN?.trim().replace(
    /^["']|["']$/g,
    "",
  );

  if (!token) {
    return (
      <div className="text-muted-foreground flex h-dvh flex-col items-center justify-center gap-2 p-6 text-center text-sm">
        <p>Set NEXT_PUBLIC_DEV_LMS_TOKEN to open the voice agent.</p>
        <p className="text-xs">
          Embed iframe uses /embed/voice-agent with postMessage auth instead.
        </p>
      </div>
    );
  }

  const initialThread =
    threadId && title
      ? { id: threadId, title }
      : threadId
        ? { id: threadId, title: "Chat" }
        : undefined;

  return (
    <VoiceAgentChat
      token={token}
      chatHref="/"
      initialThread={initialThread}
    />
  );
}

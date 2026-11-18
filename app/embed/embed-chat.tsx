"use client";

import { AssistantChat } from "@/components/chat/assistant-chat";
import { readEmbedSession, saveEmbedSession } from "@/lib/lms-embed-session";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

type LmsSession = {
  token: string;
};

function parentInit(event: MessageEvent): LmsSession | undefined {
  const data = event.data;
  if (event.source !== window.parent) return;
  if (!data || data.type !== "lms-init") return;
  if (typeof data.token !== "string" || !data.token.trim()) return;
  return {
    token: data.token.trim(),
  };
}

/**
 * LMS host iframe chat. The host draws the panel; this fills it with the same
 * Thread UI used inside the home-page AssistantModal.
 */
function trimToken(value: string | undefined): string | undefined {
  const token = value?.trim().replace(/^["']|["']$/g, "");
  return token || undefined;
}

function EmbedChatBody({ theme }: { theme: "dark" | "light" }) {
  const searchParams = useSearchParams();
  const threadId = searchParams.get("thread")?.trim();
  const title = searchParams.get("title")?.trim();
  const [session, setSession] = useState<LmsSession | undefined>(() => {
    const stored = readEmbedSession();
    if (stored) return stored;
    const token = trimToken(process.env.NEXT_PUBLIC_DEV_LMS_TOKEN);
    return token ? { token } : undefined;
  });

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const next = parentInit(event);
      if (!next) return;
      const token = trimToken(next.token);
      if (!token) return;
      const saved = { token };
      saveEmbedSession(saved);
      setSession(saved);
    };

    window.addEventListener("message", onMessage);
    window.parent.postMessage({ type: "lms-ready" }, "*");
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const initialThread =
    threadId && title
      ? { id: threadId, title }
      : threadId
        ? { id: threadId, title: "Chat" }
        : undefined;

  return (
    <div className={theme === "dark" ? "dark h-full" : "h-full"}>
      {session ? (
        <AssistantChat
          key={`${session.token}:${initialThread?.id ?? "new"}`}
          token={session.token}
          presentation="fullscreen"
          initialThread={initialThread}
        />
      ) : (
        <div className="text-muted-foreground flex h-full items-center justify-center p-6 text-sm">
          Connecting to your LMS session…
        </div>
      )}
    </div>
  );
}

export function EmbedChat({ theme }: { theme: "dark" | "light" }) {
  return (
    <Suspense fallback={<div className="h-full" />}>
      <EmbedChatBody theme={theme} />
    </Suspense>
  );
}

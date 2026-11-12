"use client";

import { AssistantChat } from "@/components/assistant-chat";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

/**
 * Dev / standalone home: full-page chat (ChatGPT-style).
 * Pass a bearer via NEXT_PUBLIC_DEV_LMS_TOKEN for local smoke.
 * LMS iframe still uses /embed with the floating widget launcher.
 */
function HomeChatBody() {
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
        <p>Set NEXT_PUBLIC_DEV_LMS_TOKEN to open the LMS chat.</p>
        <p className="text-xs">
          Embed iframe uses /embed with postMessage auth instead.
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
    <div className="h-dvh">
      <AssistantChat
        token={token}
        presentation="fullscreen"
        initialThread={initialThread}
      />
    </div>
  );
}

export function HomeChat() {
  return (
    <Suspense
      fallback={
        <div className="text-muted-foreground flex h-dvh items-center justify-center text-sm">
          Loading…
        </div>
      }
    >
      <HomeChatBody />
    </Suspense>
  );
}

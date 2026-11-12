"use client";

import { ThreadsHistoryPage } from "@/components/threads-history";
import { readEmbedSession, saveEmbedSession } from "@/lib/lms-embed-session";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function trimToken(value: string | undefined): string | undefined {
  const token = value?.trim().replace(/^["']|["']$/g, "");
  return token || undefined;
}

function EmbedHistoryBody() {
  const searchParams = useSearchParams();
  const activeId = searchParams.get("thread") ?? undefined;
  const [session, setSession] = useState(() => {
    const stored = readEmbedSession();
    if (stored) return stored;
    const token = trimToken(process.env.NEXT_PUBLIC_DEV_LMS_TOKEN);
    return token ? { token } : undefined;
  });

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const data = event.data;
      if (event.source !== window.parent) return;
      if (!data || data.type !== "lms-init") return;
      if (typeof data.token !== "string" || !data.token.trim()) return;
      const next = {
        token: data.token.trim(),
        role: typeof data.role === "string" ? data.role : undefined,
      };
      saveEmbedSession(next);
      setSession(next);
    };
    window.addEventListener("message", onMessage);
    window.parent.postMessage({ type: "lms-ready" }, "*");
    return () => window.removeEventListener("message", onMessage);
  }, []);

  if (!session) {
    return (
      <div className="text-muted-foreground flex h-dvh items-center justify-center p-6 text-sm">
        Connecting to your LMS session…
      </div>
    );
  }

  return (
    <ThreadsHistoryPage
      token={session.token}
      role={session.role}
      chatHref="/embed"
      activeId={activeId}
    />
  );
}

export function EmbedHistoryClient() {
  return (
    <Suspense
      fallback={
        <div className="text-muted-foreground flex h-dvh items-center justify-center text-sm">
          Loading…
        </div>
      }
    >
      <EmbedHistoryBody />
    </Suspense>
  );
}

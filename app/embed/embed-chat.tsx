"use client";

import { AssistantChat } from "@/components/assistant-chat";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

type LmsSession = {
  token: string;
  role?: string;
};

function parentInit(event: MessageEvent): LmsSession | undefined {
  const data = event.data;
  if (event.source !== window.parent) return;
  if (!data || data.type !== "lms-init") return;
  if (typeof data.token !== "string" || !data.token.trim()) return;
  return {
    token: data.token.trim(),
    role: typeof data.role === "string" ? data.role : undefined,
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

export function EmbedChat() {
  const theme = useSearchParams().get("theme") === "dark" ? "dark" : "light";
  const [session, setSession] = useState<LmsSession | undefined>(() => {
    const token = trimToken(process.env.NEXT_PUBLIC_DEV_LMS_TOKEN);
    return token ? { token } : undefined;
  });

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const next = parentInit(event);
      if (!next) return;
      const token = trimToken(next.token);
      if (!token) return;
      setSession({ token, role: next.role });
    };

    window.addEventListener("message", onMessage);
    window.parent.postMessage({ type: "lms-ready" }, "*");
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return (
    <div className={theme === "dark" ? "dark h-full" : "h-full"}>
      {session ? (
        <AssistantChat
          key={session.token}
          token={session.token}
          role={session.role}
          presentation="fullscreen"
        />
      ) : (
        <div className="text-muted-foreground flex h-full items-center justify-center p-6 text-sm">
          Connecting to your LMS session…
        </div>
      )}
    </div>
  );
}

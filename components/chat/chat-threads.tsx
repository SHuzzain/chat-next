"use client";

import { TextAnimate } from "@/components/ui/text-animate";
import { TooltipIconButton } from "@/components/shared/tooltip-icon-button";
import { useLmsSession } from "@/components/providers/lms-session";
import { displayThreadTitle } from "@/components/chat/threads-history";
import { withBasePath } from "@/lib/base-path";
import { useAuiState } from "@assistant-ui/react";
import { HistoryIcon, PlusIcon } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  useContext,
  useEffect,
  useId,
  useState,
  type ReactNode,
} from "react";

export type SavedConversation = {
  id: string;
  title: string;
  updatedAt: string;
};

type ChatThreadControls = {
  activeId?: string;
  selectedTitle?: string;
  startThread: () => void;
  openThread: (conversation: { id: string; title: string }) => void;
};

const ChatThreadContext = createContext<ChatThreadControls | null>(null);

export function ChatThreadProvider({
  value,
  children,
}: {
  value: ChatThreadControls;
  children: ReactNode;
}) {
  return (
    <ChatThreadContext.Provider value={value}>{children}</ChatThreadContext.Provider>
  );
}

export function useChatThreads() {
  const controls = useContext(ChatThreadContext);
  if (!controls) {
    throw new Error("Chat history is unavailable.");
  }
  return controls;
}

function firstUserText(
  messages: readonly {
    role: string;
    content: readonly { type: string; text?: string }[];
  }[],
) {
  for (const message of messages) {
    if (message.role !== "user") continue;
    for (const part of message.content) {
      if (part.type === "text" && part.text?.trim()) return part.text.trim();
    }
  }
  return undefined;
}

type SavedMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

function isSavedMessage(value: unknown): value is SavedMessage {
  if (!value || typeof value !== "object") return false;
  const row = value as Partial<SavedMessage>;
  return (
    typeof row.id === "string" &&
    (row.role === "user" || row.role === "assistant") &&
    typeof row.content === "string"
  );
}

export function SavedTranscript() {
  const { token, role } = useLmsSession();
  const { activeId } = useChatThreads();
  const liveFirst = useAuiState((state) => firstUserText(state.thread.messages));
  const [messages, setMessages] = useState<SavedMessage[]>([]);

  useEffect(() => {
    if (!activeId) return;
    const controller = new AbortController();
    setMessages([]);
    fetch(withBasePath(`/api/conversations/${encodeURIComponent(activeId)}`), {
      headers: {
        Authorization: `Bearer ${token}`,
        ...(role ? { "x-lms-role": role } : {}),
      },
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("conversation failed");
        const body: unknown = await response.json();
        const rows =
          body && typeof body === "object" && "messages" in body ? body.messages : [];
        setMessages(Array.isArray(rows) ? rows.filter(isSavedMessage) : []);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setMessages([]);
      });
    return () => controller.abort();
  }, [activeId, role, token]);

  if (!activeId || messages.length === 0) return null;
  const savedFirst = messages.find((message) => message.role === "user")?.content.trim();
  if (liveFirst && savedFirst && liveFirst === savedFirst) return null;

  return (
    <>
      {messages.map((message) =>
        message.role === "user" ? (
          <div key={message.id} className="flex justify-end px-2">
            <div className="bg-muted max-w-[80%] rounded-(--composer-radius) px-4 py-2 text-sm wrap-break-word whitespace-pre-wrap">
              {message.content}
            </div>
          </div>
        ) : (
          <div
            key={message.id}
            className="px-2 text-sm leading-relaxed wrap-break-word whitespace-pre-wrap"
          >
            {message.content}
          </div>
        ),
      )}
    </>
  );
}

function historyHrefFor(pathname: string) {
  return pathname.startsWith("/embed") ? "/embed/history" : "/history";
}

export function ChatHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const { startThread } = useChatThreads();
  const liveTitle = useAuiState((state) => firstUserText(state.thread.messages));
  const { selectedTitle } = useChatThreads();
  const title = displayThreadTitle(liveTitle || selectedTitle);
  const titleId = useId();

  return (
    <header className="relative flex shrink-0 items-center gap-2 px-3 py-2">
      <div id={titleId} className="min-w-0 flex-1">
        <TextAnimate
          key={title}
          animation="blurInUp"
          by="text"
          as="p"
          once
          className="truncate text-sm font-medium"
        >
          {title}
        </TextAnimate>
      </div>
      <TooltipIconButton
        tooltip="Threads"
        onClick={() => router.push(historyHrefFor(pathname))}
      >
        <HistoryIcon />
      </TooltipIconButton>
      <TooltipIconButton tooltip="New thread" onClick={() => startThread()}>
        <PlusIcon />
      </TooltipIconButton>
    </header>
  );
}

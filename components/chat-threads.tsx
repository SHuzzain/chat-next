"use client";

import { TooltipIconButton } from "@/components/tooltip-icon-button";
import { useLmsSession } from "@/components/lms-session";
import { cn } from "@/lib/utils";
import { useAuiState } from "@assistant-ui/react";
import { HistoryIcon, PlusIcon } from "lucide-react";
import {
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
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
    fetch(`/api/conversations/${encodeURIComponent(activeId)}`, {
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

function isConversation(value: unknown): value is SavedConversation {
  if (!value || typeof value !== "object") return false;
  const row = value as Partial<SavedConversation>;
  return (
    typeof row.id === "string" &&
    typeof row.title === "string" &&
    typeof row.updatedAt === "string"
  );
}

export function ChatHeader() {
  const { token, role } = useLmsSession();
  const { activeId, selectedTitle, startThread, openThread } = useChatThreads();
  const liveTitle = useAuiState((state) => firstUserText(state.thread.messages));
  const title = liveTitle || selectedTitle || "New Chat";
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const [conversations, setConversations] = useState<SavedConversation[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!panelRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    setStatus("loading");
    fetch("/api/conversations", {
      headers: {
        Authorization: `Bearer ${token}`,
        ...(role ? { "x-lms-role": role } : {}),
      },
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("conversation list failed");
        const body: unknown = await response.json();
        const rows =
          body && typeof body === "object" && "conversations" in body
            ? body.conversations
            : [];
        setConversations(Array.isArray(rows) ? rows.filter(isConversation) : []);
        setStatus("idle");
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setStatus("error");
      });
    return () => controller.abort();
  }, [open, role, token]);

  return (
    <div ref={panelRef} className="relative shrink-0">
      <header className="flex items-center gap-2 px-3 py-2">
        <p id={titleId} className="min-w-0 flex-1 truncate text-sm font-medium">
          {title}
        </p>
        <TooltipIconButton
          tooltip="Threads"
          aria-expanded={open}
          aria-controls={open ? `${titleId}-threads` : undefined}
          onClick={() => setOpen((current) => !current)}
        >
          <HistoryIcon />
        </TooltipIconButton>
        <TooltipIconButton
          tooltip="New thread"
          onClick={() => {
            setOpen(false);
            startThread();
          }}
        >
          <PlusIcon />
        </TooltipIconButton>
      </header>
      {open && (
        <div
          id={`${titleId}-threads`}
          role="region"
          aria-label="Threads"
          className="bg-popover text-popover-foreground absolute inset-x-2 top-full z-20 overflow-hidden rounded-lg border shadow-md"
        >
          {status === "loading" && (
            <p className="text-muted-foreground px-3 py-3 text-sm">Loading conversations…</p>
          )}
          {status === "error" && (
            <p className="text-muted-foreground px-3 py-3 text-sm">
              Conversations could not be loaded.
            </p>
          )}
          {status === "idle" && conversations.length === 0 && (
            <p className="text-muted-foreground px-3 py-3 text-sm">No conversations yet.</p>
          )}
          {status === "idle" && conversations.length > 0 && (
            <ul className="max-h-80 overflow-y-auto py-1">
              {conversations.map((conversation) => (
                <li key={conversation.id}>
                  <button
                    type="button"
                    className={cn(
                      "hover:bg-muted w-full truncate px-3 py-2 text-left text-sm",
                      conversation.id === activeId && "bg-muted",
                    )}
                    onClick={() => {
                      setOpen(false);
                      openThread(conversation);
                    }}
                  >
                    {conversation.title}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

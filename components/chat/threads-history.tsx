"use client";

import { Input } from "@/components/ui/input";
import { TooltipIconButton } from "@/components/shared/tooltip-icon-button";
import { withBasePath } from "@/lib/base-path";
import { cn } from "@/lib/utils";
import { ArrowLeftIcon, PlusIcon, SearchIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export type HistoryConversation = {
  id: string;
  title: string;
  updatedAt: string;
};

type ThreadGroup = "Today" | "Yesterday" | "Earlier";

const THREAD_GROUP_ORDER: ThreadGroup[] = ["Today", "Yesterday", "Earlier"];

export function displayThreadTitle(raw: string | undefined, fallback = "New Chat") {
  if (!raw) return fallback;
  const cleaned = raw.replace(/\s+/g, " ").trim().replace(/[.?!]+$/u, "");
  if (!cleaned) return fallback;
  return cleaned.length > 60 ? `${cleaned.slice(0, 59)}…` : cleaned;
}

function startOfLocalDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function threadGroup(iso: string, now = new Date()): ThreadGroup {
  const day = startOfLocalDay(new Date(iso));
  const today = startOfLocalDay(now);
  const yesterday = today - 24 * 60 * 60 * 1000;
  if (day === today) return "Today";
  if (day === yesterday) return "Yesterday";
  return "Earlier";
}

function isConversation(value: unknown): value is HistoryConversation {
  if (!value || typeof value !== "object") return false;
  const row = value as Partial<HistoryConversation>;
  return (
    typeof row.id === "string" &&
    typeof row.title === "string" &&
    typeof row.updatedAt === "string"
  );
}

type ThreadsHistoryPageProps = {
  token: string;
  role?: string;
  /** Chat route to return to, e.g. `/` or `/embed`. */
  chatHref: string;
  activeId?: string;
};

/**
 * Full-page Threads history (assistant-ui style): search + Today/Yesterday/Earlier.
 * Selecting a thread navigates back to the chat route with `?thread=&title=`.
 */
export function ThreadsHistoryPage({
  token,
  role,
  chatHref,
  activeId,
}: ThreadsHistoryPageProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [conversations, setConversations] = useState<HistoryConversation[]>([]);
  const [status, setStatus] = useState<"loading" | "idle" | "error">("loading");

  useEffect(() => {
    const controller = new AbortController();
    setStatus("loading");
    fetch(withBasePath("/api/conversations"), {
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
  }, [role, token]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return conversations;
    return conversations.filter((conversation) => {
      const label = displayThreadTitle(conversation.title).toLowerCase();
      return label.includes(needle) || "new chat".includes(needle);
    });
  }, [conversations, query]);

  const grouped = useMemo(() => {
    const buckets: Record<ThreadGroup, HistoryConversation[]> = {
      Today: [],
      Yesterday: [],
      Earlier: [],
    };
    for (const conversation of filtered) {
      buckets[threadGroup(conversation.updatedAt)].push(conversation);
    }
    return THREAD_GROUP_ORDER.flatMap((label) => {
      const items = buckets[label];
      return items.length > 0 ? [{ label, items }] : [];
    });
  }, [filtered]);

  function goChat(params?: { thread?: string; title?: string }) {
    const url = new URL(chatHref, window.location.origin);
    if (params?.thread) url.searchParams.set("thread", params.thread);
    if (params?.title) url.searchParams.set("title", params.title);
    router.push(`${url.pathname}${url.search}`);
  }

  return (
    <div
      data-slot="aui_thread-list-root"
      className="bg-background text-foreground flex h-full min-h-dvh flex-col"
    >
      <header className="flex items-center gap-2 border-b px-3 py-2.5">
        <TooltipIconButton
          tooltip="Back to chat"
          className="size-8"
          onClick={() => goChat()}
        >
          <ArrowLeftIcon className="size-4" />
        </TooltipIconButton>
        <p className="min-w-0 flex-1 text-sm font-semibold tracking-tight">Threads</p>
        <TooltipIconButton
          tooltip="New thread"
          className="size-8"
          onClick={() => goChat()}
        >
          <PlusIcon className="size-4" />
        </TooltipIconButton>
      </header>

      {status === "idle" && conversations.length > 0 ? (
        <div
          data-slot="aui_thread-list-search"
          className="relative border-b px-3 py-2"
        >
          <SearchIcon
            aria-hidden
            className="text-muted-foreground pointer-events-none absolute top-1/2 left-5 size-3.5 -translate-y-1/2"
          />
          <Input
            value={query}
            onValueChange={setQuery}
            placeholder="Search threads…"
            aria-label="Search threads"
            className="h-8 rounded-full ps-8"
          />
        </div>
      ) : null}

      <div
        data-slot="aui_thread-list-items"
        className="mx-auto w-full max-w-lg min-h-0 flex-1 overflow-y-auto px-2 py-2"
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
        {status === "idle" && conversations.length > 0 && filtered.length === 0 && (
          <p className="text-muted-foreground px-3 py-3 text-sm">No threads found.</p>
        )}
        {status === "idle" &&
          grouped.map((group) => (
            <div key={group.label} className="px-1 py-1">
              <p
                data-slot="aui_thread-list-group-label"
                className="text-muted-foreground px-2 py-1 text-xs font-medium"
              >
                {group.label}
              </p>
              <ul>
                {group.items.map((conversation) => {
                  const label = displayThreadTitle(conversation.title);
                  const active = conversation.id === activeId;
                  return (
                    <li key={conversation.id}>
                      <button
                        type="button"
                        data-slot="aui_thread-list-item-trigger"
                        data-active={active || undefined}
                        aria-current={active ? "true" : undefined}
                        className={cn(
                          "hover:bg-muted/80 w-full truncate rounded-md px-2 py-2.5 text-left text-sm transition-colors",
                          active && "bg-muted",
                        )}
                        onClick={() =>
                          goChat({ thread: conversation.id, title: label })
                        }
                      >
                        {label}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
      </div>
    </div>
  );
}

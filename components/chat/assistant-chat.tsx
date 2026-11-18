"use client";

import { AssistantModal } from "@/components/chat/assistant-modal.aui";
import { Thread } from "@/components/chat/thread.aui";
import { ChatThreadProvider } from "@/components/chat/chat-threads";
import { EveAuthorization } from "@/components/providers/eve-authorization";
import { LmsSessionProvider } from "@/components/providers/lms-session";
import { QueryProvider } from "@/components/providers/query-provider";
import {
  EveWidgetFallback,
  eveToolkit,
} from "@/components/widgets/eve-toolkit";
import { appBasePath } from "@/lib/base-path";
import { composerAttachmentAdapter } from "@/lib/composer-attachments";
import { createOpenAIRealtimeVoiceAdapter } from "@/lib/voice/create-openai-realtime-adapter";
import {
  AssistantRuntimeProvider,
  AuiConfig,
  Suggestions,
  Tools,
} from "@assistant-ui/react";
import { useEveAgentRuntime } from "@assistant-ui/eve";
import { useCallback, useMemo, useRef, useState } from "react";

type AssistantChatProps = {
  token: string;
  role?: string;
  /**
   * `modal` — floating AssistantModal (LMS host can use this).
   * `fullscreen` — fill parent (standalone home + embed iframe).
   */
  presentation?: "modal" | "fullscreen";
  /** Open this conversation on mount (e.g. from `/history?thread=`). */
  initialThread?: { id: string; title: string };
  /** Open the floating modal immediately (modal presentation only). */
  defaultOpen?: boolean;
};

type OpenThread = {
  id?: string;
  title?: string;
  key: number;
};

function EveChat({
  token,
  role,
  presentation,
  sessionId,
  onSessionId,
}: AssistantChatProps & {
  sessionId?: string;
  onSessionId: (sessionId: string | undefined) => void;
}) {
  const tokenRef = useRef(token);
  const roleRef = useRef(role);
  tokenRef.current = token;
  roleRef.current = role;

  // Eve defaults to /eve/v1/* at origin root; with Next basePath it must be prefixed.
  const eveHost = appBasePath();

  const voice = useMemo(
    () =>
      createOpenAIRealtimeVoiceAdapter({
        getToken: () => tokenRef.current,
        getRole: () => roleRef.current,
      }),
    [],
  );

  const runtime = useEveAgentRuntime({
    ...(eveHost ? { host: eveHost } : {}),
    auth: {
      bearer: async () => tokenRef.current,
    },
    headers: (): Record<string, string> => {
      const headers: Record<string, string> = {
        "x-client-timezone": Intl.DateTimeFormat().resolvedOptions().timeZone,
      };
      if (roleRef.current) headers["x-lms-role"] = roleRef.current;
      return headers;
    },
    adapters: {
      attachments: composerAttachmentAdapter,
      voice,
    },
    onSessionChange: (session) => onSessionId(session?.sessionId),
    ...(sessionId
      ? { initialSession: { sessionId, streamIndex: 0 }, resume: true }
      : {}),
  });

  return (
    <AssistantRuntimeProvider
      runtime={runtime}
      config={AuiConfig({
        tools: Tools({ toolkit: eveToolkit }),
        suggestions: Suggestions([
          {
            title: "List active classes",
            label: "that are running now",
            prompt: "List active classes.",
          },
          {
            title: "Find a learner",
            label: "by name or email",
            prompt: "Find a learner by name or email.",
          },
          {
            title: "What can you do?",
            label: "in this LMS",
            prompt: "What can you help me with in this LMS?",
          },
        ]),
      })}
    >
      <LmsSessionProvider token={token} role={role}>
        <QueryProvider>
          <EveAuthorization />
          {presentation === "fullscreen" ? (
            <div className="h-full">
              <Thread components={{ ToolFallback: EveWidgetFallback }} />
            </div>
          ) : (
            <Thread components={{ ToolFallback: EveWidgetFallback }} />
          )}
        </QueryProvider>
      </LmsSessionProvider>
    </AssistantRuntimeProvider>
  );
}

export function AssistantChat({
  token,
  role,
  presentation = "modal",
  initialThread,
  defaultOpen = false,
}: AssistantChatProps) {
  const [thread, setThread] = useState<OpenThread>(() =>
    initialThread
      ? { id: initialThread.id, title: initialThread.title, key: 0 }
      : { key: 0 },
  );
  const [activeId, setActiveId] = useState<string | undefined>(initialThread?.id);
  const startThread = useCallback(() => {
    setActiveId(undefined);
    setThread((current) => ({ key: current.key + 1 }));
  }, []);
  const openThread = useCallback((conversation: { id: string; title: string }) => {
    setActiveId(conversation.id);
    setThread((current) => ({
      id: conversation.id,
      title: conversation.title,
      key: current.key + 1,
    }));
  }, []);

  const chat = (
    <EveChat
      key={`${thread.id ?? "new"}:${thread.key}`}
      token={token}
      role={role}
      presentation={presentation}
      sessionId={thread.id}
      onSessionId={setActiveId}
    />
  );

  return (
    <ChatThreadProvider
      value={{
        activeId,
        selectedTitle: thread.title,
        startThread,
        openThread,
      }}
    >
      {presentation === "fullscreen" ? (
        chat
      ) : (
        <AssistantModal defaultOpen={defaultOpen || Boolean(initialThread)}>
          {chat}
        </AssistantModal>
      )}
    </ChatThreadProvider>
  );
}

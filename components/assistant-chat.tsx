"use client";

import { AssistantModal } from "@/components/assistant-modal.aui";
import { Thread } from "@/components/thread.aui";
import { ChatThreadProvider } from "@/components/chat-threads";
import { EveAuthorization } from "@/components/eve-authorization";
import { LmsSessionProvider } from "@/components/lms-session";
import { ListWidgetRegistration } from "@/components/widgets/widget-host";
import { AssistantRuntimeProvider, AuiConfig, Suggestions } from "@assistant-ui/react";
import { useEveAgentRuntime } from "@assistant-ui/eve";
import { useCallback, useRef, useState } from "react";

type AssistantChatProps = {
  token: string;
  role?: string;
  /**
   * `modal` — floating AssistantModal (default).
   * `fullscreen` — fill parent (embed iframe).
   */
  presentation?: "modal" | "fullscreen";
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

  const runtime = useEveAgentRuntime({
    auth: {
      bearer: async () => tokenRef.current,
    },
    headers: (): Record<string, string> =>
      roleRef.current ? { "x-lms-role": roleRef.current } : {},
    onSessionChange: (session) => onSessionId(session?.sessionId),
    ...(sessionId
      ? { initialSession: { sessionId, streamIndex: 0 }, resume: true }
      : {}),
  });

  return (
    <AssistantRuntimeProvider
      runtime={runtime}
      config={AuiConfig({
        suggestions: Suggestions([
          {
            title: "What can you do?",
            label: "in this LMS",
            prompt: "What can you help me with in this LMS?",
          },
        ]),
      })}
    >
      <LmsSessionProvider token={token} role={role}>
        <ListWidgetRegistration />
        <EveAuthorization />
        {presentation === "fullscreen" ? (
          <div className="h-full">
            <Thread />
          </div>
        ) : (
          <Thread />
        )}
      </LmsSessionProvider>
    </AssistantRuntimeProvider>
  );
}

export function AssistantChat({ token, role, presentation = "modal" }: AssistantChatProps) {
  const [thread, setThread] = useState<OpenThread>({ key: 0 });
  const [activeId, setActiveId] = useState<string | undefined>();
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
      {presentation === "fullscreen" ? chat : <AssistantModal>{chat}</AssistantModal>}
    </ChatThreadProvider>
  );
}

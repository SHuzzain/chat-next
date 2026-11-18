"use client";

import { Thread } from "@/components/chat/thread.aui";
import { ChatThreadProvider } from "@/components/chat/chat-threads";
import { EveAuthorization } from "@/components/providers/eve-authorization";
import { LmsSessionProvider } from "@/components/providers/lms-session";
import { QueryProvider } from "@/components/providers/query-provider";
import {
  EveWidgetFallback,
  eveToolkit,
} from "@/components/widgets/eve-toolkit";
import { VoiceAgentShell } from "@/components/voice/voice-agent-shell";
import { appBasePath } from "@/lib/base-path";
import { createOpenAIRealtimeVoiceAdapter } from "@/lib/voice/create-openai-realtime-adapter";
import {
  AssistantRuntimeProvider,
  AuiConfig,
  Tools,
  useVoiceControls,
  useVoiceState,
} from "@assistant-ui/react";
import { useEveAgentRuntime } from "@assistant-ui/eve";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FC,
} from "react";

export type VoiceAgentChatProps = {
  token: string;
  role?: string;
  /** Resume this Eve session (from chat `?thread=`). */
  initialThread?: { id: string; title: string };
  /** Where End call / Back should return (e.g. `/` or `/embed`). */
  chatHref: string;
};

function VoiceAutoConnect() {
  const { connect, disconnect } = useVoiceControls();
  const voice = useVoiceState();
  const connectRef = useRef(connect);
  const disconnectRef = useRef(disconnect);
  connectRef.current = connect;
  disconnectRef.current = disconnect;

  useEffect(() => {
    const status = voice?.status.type;
    if (status === "running" || status === "starting") return;
    connectRef.current();
    return () => {
      disconnectRef.current();
    };
    // Connect once for the stable voice runtime.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional
  }, []);

  return null;
}

/** Stable Realtime runtime — never remounted on waiting (keeps the call up). */
function VoiceCallRuntime({
  token,
  role,
  sessionIdRef,
  onEveSessionId,
  onToolStatus,
  children,
}: {
  token: string;
  role?: string;
  sessionIdRef: { current: string | undefined };
  onEveSessionId: (sessionId: string) => void;
  onToolStatus: (
    status: "completed" | "waiting" | "failed",
    sessionId: string,
  ) => void;
  children: React.ReactNode;
}) {
  const tokenRef = useRef(token);
  const roleRef = useRef(role);
  tokenRef.current = token;
  roleRef.current = role;

  const onEveSessionIdRef = useRef(onEveSessionId);
  const onToolStatusRef = useRef(onToolStatus);
  onEveSessionIdRef.current = onEveSessionId;
  onToolStatusRef.current = onToolStatus;

  const eveHost = appBasePath();

  const voice = useMemo(
    () =>
      createOpenAIRealtimeVoiceAdapter({
        getToken: () => tokenRef.current,
        getRole: () => roleRef.current,
        getEveSessionId: () => sessionIdRef.current,
        onEveSessionId: (id) => onEveSessionIdRef.current(id),
        onToolStatus: (status, id) => onToolStatusRef.current(status, id),
      }),
    [sessionIdRef],
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
      voice,
    },
  });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <VoiceAutoConnect />
      {children}
    </AssistantRuntimeProvider>
  );
}

/** Remountable Eve Thread for mid-call widgets (same session as voice gateway). */
function VoiceWidgetRuntime({
  token,
  role,
  sessionId,
}: {
  token: string;
  role?: string;
  sessionId: string;
}) {
  const tokenRef = useRef(token);
  const roleRef = useRef(role);
  tokenRef.current = token;
  roleRef.current = role;

  const eveHost = appBasePath();

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
    initialSession: { sessionId, streamIndex: 0 },
    resume: true,
  });

  return (
    <AssistantRuntimeProvider
      runtime={runtime}
      config={AuiConfig({
        tools: Tools({ toolkit: eveToolkit }),
      })}
    >
      <EveAuthorization />
      <Thread
        variant="voice"
        autoFocus={false}
        components={{ ToolFallback: EveWidgetFallback }}
      />
    </AssistantRuntimeProvider>
  );
}

export const VoiceAgentChat: FC<VoiceAgentChatProps> = ({
  token,
  role,
  initialThread,
  chatHref,
}) => {
  const [sessionId, setSessionId] = useState<string | undefined>(
    initialThread?.id,
  );
  const [widgetKey, setWidgetKey] = useState(0);
  const [needsInput, setNeedsInput] = useState(false);
  const sessionIdRef = useRef(sessionId);
  sessionIdRef.current = sessionId;

  const onEveSessionId = useCallback((id: string) => {
    sessionIdRef.current = id;
    setSessionId(id);
  }, []);

  const onToolStatus = useCallback(
    (status: "completed" | "waiting" | "failed", id: string) => {
      sessionIdRef.current = id;
      setSessionId(id);
      if (status === "waiting") {
        setNeedsInput(true);
        setWidgetKey((key) => key + 1);
        return;
      }
      if (status === "completed") setNeedsInput(false);
    },
    [],
  );

  return (
    <LmsSessionProvider token={token} role={role}>
      <QueryProvider>
        <ChatThreadProvider
          value={{
            activeId: sessionId,
            selectedTitle: initialThread?.title,
            startThread: () => undefined,
            openThread: () => undefined,
          }}
        >
          <VoiceCallRuntime
            token={token}
            role={role}
            sessionIdRef={sessionIdRef}
            onEveSessionId={onEveSessionId}
            onToolStatus={onToolStatus}
          >
            <VoiceAgentShell
              needsInput={needsInput}
              chatHref={chatHref}
              sessionId={sessionId}
              interaction={
                sessionId ? (
                  <VoiceWidgetRuntime
                    key={`${sessionId}:${widgetKey}`}
                    token={token}
                    role={role}
                    sessionId={sessionId}
                  />
                ) : undefined
              }
            />
          </VoiceCallRuntime>
        </ChatThreadProvider>
      </QueryProvider>
    </LmsSessionProvider>
  );
};

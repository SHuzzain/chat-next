"use client";

import { useMemo, type ReactNode } from "react";
import { lastAssistantMessageIsCompleteWithToolCalls } from "ai";
import { AssistantRuntimeProvider } from "@assistant-ui/react";
import {
  AssistantChatTransport,
  useChatRuntime,
} from "@assistant-ui/react-ai-sdk";

import { RenderWidgetToolUI } from "@/components/assistant-ui/tool-uis";
import { WidgetAuthProvider } from "@/components/dynamic-widgets/widget-auth-context";

type AssistantProviderProps = {
  origin: string;
  token: string;
  role?: string;
  children: ReactNode;
};

export function AssistantProvider({
  origin,
  token,
  role,
  children,
}: AssistantProviderProps) {
  const transport = useMemo(
    () =>
      new AssistantChatTransport({
        api: "/api/chat/gpt",
        body: { origin, token, role },
      }),
    [origin, token, role],
  );

  // Critical for human tools (render_widget): after addResult / addToolOutput,
  // automatically POST messages back so the model continues (next tool / answer).
  const runtime = useChatRuntime({
    transport,
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
  });

  return (
    <WidgetAuthProvider value={{ token, origin, role }}>
      <AssistantRuntimeProvider runtime={runtime}>
        <RenderWidgetToolUI />
        {children}
      </AssistantRuntimeProvider>
    </WidgetAuthProvider>
  );
}

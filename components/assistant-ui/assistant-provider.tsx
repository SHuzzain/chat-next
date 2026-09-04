"use client";

import { useMemo, type ReactNode } from "react";
import { lastAssistantMessageIsCompleteWithToolCalls } from "ai";
import { AssistantRuntimeProvider } from "@assistant-ui/react";
import {
  AssistantChatTransport,
  useChatRuntime,
} from "@assistant-ui/react-ai-sdk";

import { ChatToolHeaders } from "@/types/chat";

type AssistantProviderProps = {
  headers: ChatToolHeaders;
  children: ReactNode;
};

export function AssistantProvider({ headers, children }: AssistantProviderProps) {
  const transport = useMemo(
    () =>
      new AssistantChatTransport({
        api: "/api/chat/gpt",
        body: headers,
      }),
    [headers],
  );


  const runtime = useChatRuntime({
    transport,
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
  });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      {children}
    </AssistantRuntimeProvider>
  );
}

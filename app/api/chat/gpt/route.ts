import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  stepCountIs,
  streamText,
  toUIMessageStream,
  type UIMessage,
} from "ai";
import { openai } from "@ai-sdk/openai";
import { NextRequest, NextResponse } from "next/server";

import { SYSTEM_PROMPT } from "@/lib/prompt";
import { createChatTools } from "@/mcptools";
import { ChatToolHeaders } from "@/types/chat";
import { AISDKToolkit, FrontendTools } from "@assistant-ui/react-ai-sdk";

const aiToolkit = (headers: ChatToolHeaders) =>
  new AISDKToolkit({
    toolkit: createChatTools(headers),
  });

interface ChatBody extends ChatToolHeaders {
  messages: UIMessage[];
  tools: FrontendTools;
}

export async function POST(req: NextRequest) {
  try {
    const body: ChatBody = await req.json();
    const { messages, tools, ...headers } = body;

    const result = streamText({
      model: openai("gpt-4o-mini"),
      system: SYSTEM_PROMPT,
      messages: await convertToModelMessages(messages),
      tools: await aiToolkit(headers).tools({ frontend: tools }),
      stopWhen: stepCountIs(8),
    });

    return createUIMessageStreamResponse({
      stream: toUIMessageStream({ stream: result.stream }),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

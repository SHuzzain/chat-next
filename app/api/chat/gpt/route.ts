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

interface ChatBody {
  messages: UIMessage[];
  origin: string;
  token: string;
  role?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: ChatBody = await req.json();
    const { messages, origin, token } = body;

    const result = streamText({
      model: openai("gpt-4o-mini"),
      system: SYSTEM_PROMPT,
      messages: await convertToModelMessages(messages),
      tools: createChatTools(origin, token),
      // Allow: search → optional sandbox → render_widget → detail tool → answer
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

import { stepCountIs, streamText } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";

import { SYSTEM_PROMPT } from "@/lib/prompt";
import { getTools } from "@/actions/get-tools";
import { NextResponse } from "next/server";
import { Message } from "@/types/chat";

interface ChatBody {
  messages: Message[];
  origin: string;
  token: string;
}

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

export async function POST(req: Request) {
  try {
    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json(
        { success: false, error: "OpenRouter API key is not configured" },
        { status: 401 },
      );
    }
    const body: ChatBody = await req.json();
    const { messages, origin, token } = body;
    const tools = await getTools(origin, token);

    const result = streamText({
      model: openrouter.chat("openai/gpt-4o-mini"),
      system: SYSTEM_PROMPT,
      messages: messages
        .filter((message) => message.content)
        .map((message) => ({
          role: message.role,
          content: message.content,
        })),
      tools: tools,
      maxOutputTokens: 1000,
      stopWhen: stepCountIs(5),
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

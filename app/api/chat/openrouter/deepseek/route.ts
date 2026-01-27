import { streamText } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";

import { SYSTEM_PROMPT } from "@/lib/prompt";
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
    const { messages } = body;
    console.log({ messages });

    const result = streamText({
      model: openrouter.chat("deepseek/deepseek-r1-0528:free"),
      system: SYSTEM_PROMPT,
      messages: messages
        .filter((message) => message.content)
        .map((message) => ({
          role: message.role,
          content: message.content,
        })),
      maxOutputTokens: 1000,
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

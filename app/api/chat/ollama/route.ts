// we need to create a route that will handle the chat with the ollama model
import { NextRequest, NextResponse } from "next/server";
import { stepCountIs, streamText } from "ai";
import { createOllama } from "ai-sdk-ollama";
import { SYSTEM_PROMPT } from "@/lib/prompt";
import { createChatTools } from "@/mcptools";
import { Message } from "@/types/chat";

interface ChatBody {
  messages: Message[];
  origin: string;
  token: string;
  role?: string;
}

const ollama = createOllama({
  baseURL: "https://aidev-api.champslms.com/ollama",
});

export async function POST(req: NextRequest) {
  try {
    const body: ChatBody = await req.json();
    const { messages } = body;

    const result = streamText({
      model: ollama("mistral"),
      system: SYSTEM_PROMPT,
      messages: messages
        .filter((message) => message.content)
        .map((message) => ({
          role: message.role,
          content: message.content,
        })),
      tools: createChatTools({
        origin: body.origin,
        token: body.token,
        role: body.role || "",
      }),
      stopWhen: stepCountIs(8),
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

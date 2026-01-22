import { stepCountIs, streamText } from "ai";
import { openai } from "@ai-sdk/openai";

import { SYSTEM_PROMPT } from "@/lib/prompt";
import { getTools } from "@/actions/get-tools";
import { NextResponse } from "next/server";
import { Message } from "@/types/chat";

interface ChatBody {
  messages: Message[];
  origin: string;
  token: string;
}

export async function POST(req: Request) {
  try {
    const body: ChatBody = await req.json();
    const { messages, origin, token } = body;
    const tools = await getTools(origin, token);
    
    console.log({ messages })

    const result = streamText({
      model: openai("gpt-4.1-nano"),
      system: SYSTEM_PROMPT,
      messages: messages.filter(message => message.content).map(message => ({
        role: message.role,
        content: message.content,
      })).reverse(),
      tools,
      stopWhen: stepCountIs(5),
    });


    return result.toTextStreamResponse();
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

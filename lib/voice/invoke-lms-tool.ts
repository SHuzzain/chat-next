import { withBasePath } from "@/lib/base-path";
import type { ExchangeSdpAuth } from "@/lib/voice/exchange-sdp";
import { LMS_AGENT_TOOL_NAME } from "@/lib/voice/realtime-tools";

export type InvokeLmsToolInput = {
  name: string;
  callId: string;
  arguments: string;
  eveSessionId?: string;
  signal: AbortSignal;
};

export type InvokeLmsToolResult = {
  output: string;
  eveSessionId: string;
  status: "completed" | "waiting" | "failed";
};

/** Browser → POST /api/voice/tool (never hits LMS APIs directly). */
export async function invokeLmsTool(
  auth: ExchangeSdpAuth,
  input: InvokeLmsToolInput,
): Promise<InvokeLmsToolResult> {
  if (input.name !== LMS_AGENT_TOOL_NAME) {
    throw new Error(`Unsupported voice tool: ${input.name}`);
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${auth.getToken()}`,
  };
  const role = auth.getRole?.()?.trim();
  if (role) headers["x-lms-role"] = role;

  let argumentsPayload: unknown = input.arguments;
  try {
    argumentsPayload = JSON.parse(input.arguments) as unknown;
  } catch {
    // Gateway also accepts the raw string and validates.
  }

  const response = await fetch(withBasePath("/api/voice/tool"), {
    method: "POST",
    headers,
    body: JSON.stringify({
      name: LMS_AGENT_TOOL_NAME,
      call_id: input.callId,
      arguments: argumentsPayload,
      ...(input.eveSessionId ? { eveSessionId: input.eveSessionId } : {}),
    }),
    signal: input.signal,
  });

  if (!response.ok) {
    const message =
      (await response.json().catch(() => null) as { message?: string } | null)
        ?.message || "Could not run LMS assistant.";
    throw new Error(message);
  }

  const json = (await response.json()) as {
    output?: string;
    eveSessionId?: string;
    status?: InvokeLmsToolResult["status"];
  };

  if (typeof json.output !== "string" || typeof json.eveSessionId !== "string") {
    throw new Error("Invalid voice tool response.");
  }

  return {
    output: json.output,
    eveSessionId: json.eveSessionId,
    status: json.status ?? "completed",
  };
}

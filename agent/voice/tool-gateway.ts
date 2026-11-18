import { z } from "zod";

import { currentPrincipalId } from "@/lib/current-principal";
import type { LmsAuth } from "@/lib/auth";
import {
  LMS_AGENT_TOOL_NAME,
  parseLmsAgentArgs,
} from "@/lib/voice/realtime-tools";
import { runEveVoiceTurn } from "@/agent/voice/eve-adapter";

const gatewayBodySchema = z.object({
  name: z.literal(LMS_AGENT_TOOL_NAME),
  call_id: z.string().min(1).max(200),
  arguments: z.unknown(),
  eveSessionId: z.string().min(1).max(200).optional(),
});

export type VoiceToolGatewayInput = z.infer<typeof gatewayBodySchema>;

export type VoiceToolGatewayResult = {
  call_id: string;
  output: string;
  eveSessionId: string;
  status: "completed" | "waiting" | "failed";
};

const recentCallIds = new Map<string, number>();
const CALL_ID_TTL_MS = 5 * 60_000;

function pruneCallIds(now: number) {
  for (const [id, at] of recentCallIds) {
    if (now - at > CALL_ID_TTL_MS) recentCallIds.delete(id);
  }
}

/** Reject duplicate Realtime function-call deliveries. */
export function claimFunctionCallId(callId: string): boolean {
  const now = Date.now();
  pruneCallIds(now);
  if (recentCallIds.has(callId)) return false;
  recentCallIds.set(callId, now);
  return true;
}

export async function executeVoiceToolGateway(options: {
  auth: LmsAuth;
  body: unknown;
  signal?: AbortSignal;
}): Promise<VoiceToolGatewayResult> {
  const parsed = gatewayBodySchema.safeParse(options.body);
  if (!parsed.success) {
    throw new VoiceToolGatewayError(400, "Invalid voice tool payload.");
  }

  const { call_id, arguments: rawArgs, eveSessionId } = parsed.data;
  if (!claimFunctionCallId(call_id)) {
    throw new VoiceToolGatewayError(409, "Duplicate function call.");
  }

  // Re-resolve principal from LMS — never trust client ids/roles/permissions.
  await currentPrincipalId(options.auth);

  const { message } = parseLmsAgentArgs(rawArgs);
  const turn = await runEveVoiceTurn({
    auth: options.auth,
    message,
    sessionId: eveSessionId,
    signal: options.signal,
  });

  return {
    call_id,
    output: turn.spoken,
    eveSessionId: turn.sessionId,
    status: turn.status,
  };
}

export class VoiceToolGatewayError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "VoiceToolGatewayError";
  }
}

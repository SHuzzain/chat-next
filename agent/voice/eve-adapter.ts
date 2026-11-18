import { Client } from "eve/client";

import { appBasePath } from "@/lib/base-path";
import type { LmsAuth } from "@/lib/auth";

export type EveVoiceTurnResult = {
  sessionId: string;
  status: "completed" | "waiting" | "failed";
  /** Spoken-friendly summary for Realtime. */
  spoken: string;
};

function eveClientHost(): string {
  const origin =
    process.env.LMS_AGENT_INTERNAL_URL?.replace(/\/$/, "") ||
    "http://127.0.0.1:3607";
  return `${origin}${appBasePath()}`;
}

function createEveClient(auth: LmsAuth) {
  return new Client({
    host: eveClientHost(),
    auth: {
      bearer: auth.token,
    },
    headers: () => {
      const headers: Record<string, string> = {};
      if (auth.role) headers["x-lms-role"] = auth.role;
      return headers;
    },
  });
}

function summarizeWaiting(inputRequests: readonly { kind?: string }[]): string {
  if (inputRequests.length === 0) {
    return "I need a bit more information or confirmation before I can finish that. You can continue in the text chat if the next step needs a form or picker.";
  }
  return "I need your confirmation or more details before finishing that LMS action. Continue in the text chat for forms and pickers, or tell me the missing details now.";
}

/**
 * Run one user message through the existing Eve agent (same tools + LMS auth).
 * Does not duplicate tool business logic — Eve selects and executes tools.
 */
export async function runEveVoiceTurn(options: {
  auth: LmsAuth;
  message: string;
  sessionId?: string;
  signal?: AbortSignal;
}): Promise<EveVoiceTurnResult> {
  const client = createEveClient(options.auth);
  const clientContext = {
    channel: "voice",
    note: "Voice gateway turn — prefer concise answers; widgets are limited on voice.",
  };

  const response = options.sessionId
    ? await client.sessions
        .attach(options.sessionId)
        .send(options.message, {
          signal: options.signal,
          clientContext,
        })
    : (
        await client.sessions.create({
          message: options.message,
          signal: options.signal,
          clientContext,
        })
      ).response;

  const result = await response.result();
  const sessionId = result.sessionId;

  if (result.status === "failed") {
    return {
      sessionId,
      status: "failed",
      spoken:
        result.message?.trim() ||
        "Sorry — the LMS assistant could not complete that request.",
    };
  }

  if (result.status === "waiting") {
    const base = result.message?.trim();
    return {
      sessionId,
      status: "waiting",
      spoken: base
        ? `${base} ${summarizeWaiting(result.inputRequests)}`
        : summarizeWaiting(result.inputRequests),
    };
  }

  return {
    sessionId,
    status: "completed",
    spoken:
      result.message?.trim() ||
      "Done. I do not have more detail to add from the LMS assistant.",
  };
}

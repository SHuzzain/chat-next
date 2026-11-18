/** OpenAI Realtime function-tool schema for the LMS Eve gateway. */
export const LMS_AGENT_TOOL_NAME = "lms_agent" as const;

export const LMS_AGENT_TOOL = {
  type: "function" as const,
  name: LMS_AGENT_TOOL_NAME,
  description:
    "Use the authenticated MindChamps LMS assistant to answer LMS questions and perform permitted LMS operations.",
  parameters: {
    type: "object",
    properties: {
      message: {
        type: "string",
        description:
          "The user's LMS request in natural language (include any confirmed details).",
      },
    },
    required: ["message"],
    additionalProperties: false,
  },
};

export type LmsAgentToolArgs = {
  message: string;
};

export function parseLmsAgentArgs(raw: unknown): LmsAgentToolArgs {
  let value = raw;

  // Realtime may send a JSON string, a plain utterance, or an object.
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      throw new Error("lms_agent message must not be empty.");
    }
    if (trimmed.startsWith("{")) {
      try {
        value = JSON.parse(trimmed) as unknown;
      } catch {
        // Treat as the spoken request when the model emits non-JSON text.
        return { message: trimmed };
      }
    } else {
      return { message: trimmed };
    }
  }

  if (
    value === null ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    typeof (value as { message?: unknown }).message !== "string"
  ) {
    throw new Error('lms_agent requires a string "message" field.');
  }
  const message = (value as { message: string }).message.trim();
  if (!message) {
    throw new Error("lms_agent message must not be empty.");
  }
  return { message };
}

/** Session payload fragment for POST /api/realtime (OpenAI Realtime calls). */
export function realtimeSessionToolsConfig() {
  return {
    tools: [LMS_AGENT_TOOL],
    tool_choice: "auto" as const,
  };
}

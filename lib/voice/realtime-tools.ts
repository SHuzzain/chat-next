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
  if (typeof value === "string") {
    try {
      value = JSON.parse(value) as unknown;
    } catch {
      throw new Error("lms_agent arguments must be valid JSON.");
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

import { ToolSet } from "ai";
import { createSandboxTools } from "@/lib/sandbox-tools";
import { courseCentreMcpZodTools } from "./course-centres";
import { unitMcpZodTools } from "./units";
import { userMcpZodTools } from "./users";
import { ChatToolHeaders } from "@/types/chat";

type ToolFactory = (headers: ChatToolHeaders) => ToolSet;

const mcpRegistry = {
  user: userMcpZodTools,
  course_centre: courseCentreMcpZodTools,
  unit: unitMcpZodTools,
} satisfies Record<string, ToolFactory>;

function namespaceTools(namespace: string, tools: ToolSet): ToolSet {
  const namespacedTools: ToolSet = {};

  for (const [toolName, tool] of Object.entries(tools)) {
    const namespacedName = `${namespace}_${toolName}`;

    if (namespacedName in namespacedTools) {
      throw new Error(`Duplicate MCP tool: ${namespacedName}`);
    }

    namespacedTools[namespacedName] = tool;
  }

  return namespacedTools;
}

/** LMS MCP tools only (namespaced). */
export function createMcpTools(headers: ChatToolHeaders): ToolSet {
  const tools: ToolSet = {};

  for (const [namespace, factory] of Object.entries(mcpRegistry)) {
    const moduleTools = factory(headers);
    const namespacedTools = namespaceTools(namespace, moduleTools);

    Object.assign(tools, namespacedTools);
  }

  return tools;
}

/**
 * Full tool set for chat routes:
 * - namespaced MCP tools
 * - render_widget (declarative human UI)
 * - execute_js (Vercel Sandbox)
 */
export function createChatTools(headers: ChatToolHeaders): ToolSet {
  return {
    ...createMcpTools(headers),
    ...createSandboxTools(),
  };
}

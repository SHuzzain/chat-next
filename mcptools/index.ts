import { ToolSet } from "ai";
import { courseCentreMcpZodTools } from "./course-centre-mcp";
import { userMcpZodTools } from "./user-mcp";

type ToolFactory = (origin: string, token: string) => ToolSet;

const mcpRegistry = {
  user: userMcpZodTools,
  course_centre: courseCentreMcpZodTools,
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

export function createMcpTools(origin: string, token: string): ToolSet {
  const tools: ToolSet = {};

  for (const [namespace, factory] of Object.entries(mcpRegistry)) {
    const moduleTools = factory(origin, token);
    const namespacedTools = namespaceTools(namespace, moduleTools);

    Object.assign(tools, namespacedTools);
  }

  return tools;
}

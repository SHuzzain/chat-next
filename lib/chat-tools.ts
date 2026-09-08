import { ToolSet } from "ai";
import { createMCPClient } from "@ai-sdk/mcp";
import { createSandboxTools } from "@/lib/sandbox-tools";
import { createInteractiveHumanTools } from "@/lib/dynamic-widgets/render-widget-tool";

/**
 * Chat tool set:
 * - LMS MCP tools from lms-mcp-server
 * - render_widget
 * - execute_js (Vercel Sandbox)
 *
 * Domain MCP models previously lived in /mcptools and will be added later.
 */
export async function createChatTools(_origin: string, token: string = "") {
  const mcpServerUrl =
    process.env.LMS_MCP_SERVER_URL || "http://localhost:3102/mcp";

  const mcpClient = await createMCPClient({
    transport: {
      type: "http",
      url: mcpServerUrl,
      headers: {
        Authorization: token.startsWith("Bearer ") ? token : `Bearer ${token}`,
      },
    },
  });

  const tools = (await mcpClient.tools()) as unknown as ToolSet;

  return {
    ...tools,
    ...createInteractiveHumanTools(),
    ...createSandboxTools(),
  };
}

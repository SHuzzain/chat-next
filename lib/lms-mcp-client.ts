import { createMCPClient } from "@ai-sdk/mcp";
import type { ToolSet } from "ai";

/**
 * Creates an MCP client for LMS MCP Server using the official @ai-sdk/mcp package.
 */
export async function createLmsMcpClient(token: string) {
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

  const tools: ToolSet = await mcpClient.tools();

  return {
    mcpClient,
    tools,
  };
}

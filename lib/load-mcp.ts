import type { z } from "zod";
import { httpExecute } from "./http-call";
import { Tool, tool } from "ai";
import { jsonSchemaToZod } from "./json-schema-to-zod";
import { backendResponseSchema } from "@/schema/tools";

type McpToolGroup = z.infer<typeof backendResponseSchema>["mcpTools"][number];

function buildToolDescription(
  groupDescription: string | undefined,
  toolDescription: string,
  responseDescription?: string,
): string {
  const parts = [
    groupDescription,
    toolDescription,
    responseDescription ? `Response: ${responseDescription}` : undefined,
  ].filter(Boolean);

  return parts.join(" ");
}

export async function loadMcpFromConfig(
  baseUrl: string,
  group: McpToolGroup,
  token: string,
  role?: string,
) {
  const toolsMaps: Record<string, Tool> = {};

  for (const def of group.tools) {
    toolsMaps[def.name] = tool({
      description: buildToolDescription(
        group.description,
        def.description,
        def.responseDescription,
      ),
      inputSchema: jsonSchemaToZod(def.inputSchema),
      execute: httpExecute({
        endpoint: def.endpoint,
        method: def.method as "GET" | "POST" | "PUT" | "DELETE",
        origin: baseUrl,
        token,
        role,
        pathParams: def.pathParams,
        queryParams: def.queryParams,
        bodyParams: def.bodyParams,
      }),
    });
  }

  return toolsMaps;
}

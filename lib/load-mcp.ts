import type { z } from "zod";
import { httpExecute } from "./http-call";
import { Tool, tool } from "ai";
import { jsonSchemaToZod } from "./json-schema-to-zod";
import { backendResponseSchema } from "@/schema/tools";

type McpToolGroup = z.infer<typeof backendResponseSchema>["mcpTools"][number];



export async function loadMcpFromConfig(
  baseUrl: string,
  group: McpToolGroup,
  token: string
) {
  const toolsMaps: Record<string, Tool> = {};

  for (const def of group.tools) {

    toolsMaps[def.name] = tool({
      description: def.description,
      inputSchema: jsonSchemaToZod(def.inputSchema),
      execute: httpExecute({
        endpoint: def.endpoint,
        method: def.method as "GET" | "POST" | "PUT" | "DELETE",
        origin: baseUrl,
        token,
        pathParams: def.pathParams,
        queryParams: def.queryParams,
      }),
    });
  }

  return toolsMaps;
}

import { loadMcpFromConfig } from "@/lib/load-mcp";
import { backendResponseSchema } from "@/schema/tools";
import { Tool } from "ai";
import z from "zod";

export async function getTools(origin: string, token: string): Promise<Record<string, Tool>> {
    const response = await fetch(`${process.env.BASE_URL}/api/get-tool?origin=${origin}&token=${token}`);
    if (!response.ok) {
        console.error(response);
        throw new Error("Failed to fetch tools");
    }
    const values = await response.json() as { data: z.infer<typeof backendResponseSchema>, success: boolean };
    const { baseUrl, mcpTools } = values.data;
    const toolMaps = await Promise.all(mcpTools.map((group) => loadMcpFromConfig(baseUrl, group, token)));
    const tools = toolMaps.reduce((acc, curr) => ({ ...acc, ...curr }), {});
    return tools;
}
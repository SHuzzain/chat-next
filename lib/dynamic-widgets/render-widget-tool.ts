import { tool, type ToolSet } from "ai";

import {
  renderWidgetToolInputSchema,
  type DynamicWidget,
} from "@/lib/dynamic-widgets/schemas";

export const RENDER_WIDGET_TOOL_NAME = "render_widget";

export type RenderWidgetArgs = DynamicWidget;

/**
 * Human-in-the-loop UI tool — no server `execute`.
 * The model supplies widget config as tool args; the client Tool UI renders
 * trusted widgets and completes via `addResult` after the user submits.
 */
export function createInteractiveHumanTools(): ToolSet {
  return {
    [RENDER_WIDGET_TOOL_NAME]: tool({
      description: [
        "Render a trusted interactive widget in the chat.",
        "Use this tool when the user must select an entity, provide structured input, confirm an action, or view paginated data.",
        "Remote LMS widget resources will be wired again later; until then prefer static options.",
      ].join(" "),
      inputSchema: renderWidgetToolInputSchema,
    }),
  };
}

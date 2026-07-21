import { tool, type ToolSet } from "ai";

import {
  renderWidgetToolInputSchema,
  type DynamicWidget,
} from "@/lib/dynamic-widgets/schemas";

export const RENDER_WIDGET_TOOL_NAME = "render_widget";

/** @deprecated Use render_widget */
export const ASK_USER_CHOICE_TOOL_NAME = RENDER_WIDGET_TOOL_NAME;

export type RenderWidgetArgs = DynamicWidget;

/**
 * Human-in-the-loop UI tool — no server `execute`.
 * The model supplies widget config as tool args; the client Tool UI renders
 * trusted widgets and completes via `addResult` after the user submits.
 *
 * Do NOT add `execute`: that would finish the tool immediately, disable the
 * widget (search/pagination), and skip waiting for the user.
 *
 * inputSchema must be a root Zod object (not discriminatedUnion) — OpenAI
 * rejects union schemas as `type: "None"`.
 */
export function createInteractiveHumanTools(): ToolSet {
  return {
    [RENDER_WIDGET_TOOL_NAME]: tool({
      description: [
        "Render a trusted interactive widget in the chat.",
        "Use this tool when the user must select an entity, provide structured input, confirm an action, or view paginated data.",

        "Use async-select or async-multi-select when a required entity ID is unknown or the user provided only a name.",
        "Use async-table only when all required identifiers and filters are already known.",
        "Use radio-group, checkbox-group, or option-cards for small static option sets.",
        "Use confirmation for yes/no decisions.",
        "Use dynamic-form for multi-field input.",

        "The frontend handles remote loading, searching, filtering, sorting, and pagination without additional model calls.",
        "Use only supported resource names and valid field paths.",
        "Never provide API URLs, credentials, headers, HTML, JavaScript, or other executable content.",

        "After submission, use the compact widget result to continue the workflow.",
      ].join(" "),

      inputSchema: renderWidgetToolInputSchema,
    }),
  };
}

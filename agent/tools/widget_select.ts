import { defineTool } from "eve/tools";

import { widgetSelectParameters, widgetSelectResult } from "@/lib/widgets/schema/widget-select";

/**
 * Model-facing radio widget. Call only when a list tool sets `nextTool` to
 * `widget_select`. The toolkit renders the choices from these arguments.
 */
export default defineTool({
  description: `
Show radio choices so the user can pick one matching record.

Call this only when a list tool result sets nextTool to widget_select.
Write one short line asking the user to verify which match, then pass that
result's arguments through unchanged. Wait for the user to choose. Do not guess an id.
  `,
  inputSchema: widgetSelectParameters,
  outputSchema: widgetSelectResult,
  execute: async (args) => args,
  endsTurn: true,
  label: {
    start: () => "Showing choices…",
    complete: () => "Choices shown",
  },
});

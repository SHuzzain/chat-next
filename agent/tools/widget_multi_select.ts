import { defineTool } from "eve/tools";

import {
  widgetMultiSelectParameters,
  widgetMultiSelectResult,
} from "@/lib/widgets/schema/widget-multi-select";

/**
 * Model-facing checkbox widget. Call only when a list tool sets `nextTool` to
 * `widget_multi_select`. The toolkit renders the choices from these arguments.
 */
export default defineTool({
  description: `
Show checkboxes so the user can pick one or more matching records.

Call this only when a list tool result sets nextTool to widget_multi_select.
Pass that result's arguments through unchanged. Then wait for the user to choose. Do not guess ids.
  `,
  inputSchema: widgetMultiSelectParameters,
  outputSchema: widgetMultiSelectResult,
  execute: async (args) => args,
  label: {
    start: () => "Showing choices…",
    complete: () => "Choices shown",
  },
});

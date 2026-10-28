import { defineTool } from "eve/tools";

import {
  widgetDataTableParameters,
  widgetDataTableResult,
} from "@/lib/widgets/schema/widget-data-table";

/**
 * Model-facing table widget. Call only when a list tool sets `nextTool` to
 * `widget_data_table`. The toolkit renders the rows from these arguments.
 */
export default defineTool({
  description: `
Show matching records in a table.

Call this only when a list tool result sets nextTool to widget_data_table.
Pass that result's arguments through unchanged. Do not ask the user to select a record unless they asked to.
  `,
  inputSchema: widgetDataTableParameters,
  outputSchema: widgetDataTableResult,
  execute: async (args) => args,
  label: {
    start: () => "Showing records…",
    complete: () => "Records shown",
  },
});

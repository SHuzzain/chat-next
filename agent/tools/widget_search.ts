import { defineTool } from "eve/tools";

import { widgetSearchParameters, widgetSearchResult } from "@/lib/widgets/schema/widget-search";

/**
 * Model-facing search widget. Call only when a list tool sets `nextTool` to
 * `widget_search`. The toolkit renders the search input from these arguments.
 */
export default defineTool({
  description: `
Show a search input so the user can narrow a large result set.

Call this only when a list tool result sets nextTool to widget_search.
Pass that result's arguments through unchanged, including selection. Do not list the rows.
  `,
  inputSchema: widgetSearchParameters,
  outputSchema: widgetSearchResult,
  execute: async (args) => args,
  label: {
    start: () => "Showing search…",
    complete: () => "Search shown",
  },
});

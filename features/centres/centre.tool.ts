import { createPaginatedTool } from "@/lib/tools/create-paginated-tool";

import { listCourseCentresByAdvanceFilter } from "./centre.api";
import { courseCentreListSchema, courseCentreRowSchema } from "./schema";

export const courseCentreListTool = createPaginatedTool({
  description: `
List and search LMS Centres (course centres).

Use this tool when users ask about:
- Centre names, codes, or contact details
- Which organisation or business type a centre belongs to
- Centre location (country, state, city)
- Finding a centre id before other LMS operations
- Centre status or admin-related centre metadata


  `,
  querySchema: courseCentreListSchema.query,
  bodySchema: courseCentreListSchema.body,
  outputSchema: courseCentreListSchema.output,
  widget: {
    entry: "Centre",
    source: "centres",
    rowSchema: courseCentreRowSchema,
  },
  execute: (input, auth) =>
    listCourseCentresByAdvanceFilter(input.query, auth, input.body),
});

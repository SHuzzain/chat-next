import { createPaginatedTool } from "@/lib/tools/create-paginated-tool";

import { listCourseCentresByAdvanceFilter } from "./centre.api";
import { centreListSchema, centreRowSchema } from "./schema";

export const courseCentreListTool = createPaginatedTool({
  permission: "master.centre:read",
  description: `
List and search LMS Centres.

Use this tool when users ask about:
- Centre names, codes, or contact details
- Which organisation or business type a centre belongs to
- Centre location (country, state, city)
- Finding a centre id before other LMS operations
- Centre status or admin-related centre metadata

Prefer calling this tool as list-centre. Centre ids are used for create-user and reports.

Results are limited to centres the signed-in user belongs to (LMS userType=USER).
By default only ACTIVE centres are returned; set query.status to list INACTIVE (or other) centres the user can access.

  `,
  querySchema: centreListSchema.query,
  bodySchema: centreListSchema.body,
  outputSchema: centreListSchema.output,
  widget: {
    entry: "Centre",
    source: "centres",
    rowSchema: centreRowSchema,
  },
  execute: (input, auth) =>
    listCourseCentresByAdvanceFilter(input.query, auth, input.body),
});

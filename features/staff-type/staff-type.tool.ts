import { createPaginatedTool } from "@/lib/tools/create-paginated-tool";

import { listStaffTypes } from "./staff-type.api";
import {
  staffTypeListRowSchema,
  staffTypeListSchema,
} from "./schema/staff-type-list";

export const staffTypeListTool = createPaginatedTool({
  permission: "staffType:read",
  description: `
List and search LMS staff types (e.g. English Teacher, Principal).

Use purpose "resolve" and selection "single", then follow nextTool to
widget_select / widget_search. Never invent staff type ids.

Query filters: textSearch, centreId (maps to courseCentre → business type),
businessTypeId, currentStaffTypeId (exclude one id).
Body: advanceFilter, advanceFilterSelect, optional businessTypeIds (from
selected centres' business types).

Only ACTIVE staff types are returned by default.
  `,
  querySchema: staffTypeListSchema.query,
  bodySchema: staffTypeListSchema.body,
  outputSchema: staffTypeListSchema.output,
  widget: {
    entry: "Staff type",
    source: "staff-types",
    rowSchema: staffTypeListRowSchema,
  },
  execute: (input, auth) => listStaffTypes(input.query, auth, input.body),
});

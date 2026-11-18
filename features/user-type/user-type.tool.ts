import { createPaginatedTool } from "@/lib/tools/create-paginated-tool";

import { listUserTypes } from "./user-type.api";
import { userTypeListRowSchema, userTypeListSchema } from "./schema/user-type-list";

export const userTypeListTool = createPaginatedTool({
  permission: "userTypes:read",
  description: `
List LMS user types (roles) for assigning when creating a user.

GET /user-types/list query only: rowPerPage, textSearch, firstId, lastId.
Do not send advanceFilter, page, order, or a body — this is not an
advance-filter endpoint.

Use purpose "resolve" and selection "single", then follow nextTool to
widget_select. Prefer textSearch to narrow by name. Never invent type ids.
Super Admin types are excluded — do not offer or create Super Admin users.
  `,
  querySchema: userTypeListSchema.query,
  bodySchema: userTypeListSchema.body,
  outputSchema: userTypeListSchema.output,
  widget: {
    entry: "User type",
    source: "user-types",
    rowSchema: userTypeListRowSchema,
  },
  execute: (input, auth) => listUserTypes(input.query, auth, input.body),
});

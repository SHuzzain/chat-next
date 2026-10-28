import { createPaginatedTool } from "@/lib/tools/create-paginated-tool";

import { listUsers } from "./user.api";
import { userInfoListSchema, userInfoRowSchema } from "./schema";

export const userListTool = createPaginatedTool({
  description: `
List and search LMS users (learners and staff).

Use this tool when users ask about:
- Finding a person by name, email, or admission number
- User account status (ACTIVE / INACTIVE)
- Which Centres a user belongs to
- Last login, online status, or registration details
- Looking up a user id before other LMS operations that require a user id

  `,
  querySchema: userInfoListSchema.query,
  bodySchema: userInfoListSchema.body,
  outputSchema: userInfoListSchema.output,
  widget: {
    entry: "Learner",
    source: "users",
    rowSchema: userInfoRowSchema,
  },
  execute: (input, auth) => listUsers(input.query, auth, input.body),
});

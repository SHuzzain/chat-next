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

Do NOT use this tool for:
- "Users / learners in class X" or "user list of class Y" — use the Class Users report with query.classId after list-classes.
- Filtering by a Class id in any field (including courseCentre). This tool has no Class filter.

Important:
- Present "Centre" in user-facing text (not "CourseCentre").
- query.centreId filters by Centre (branch/company) only. Never put a Class id in centreId.
- advanceFilter cannot use courseCentre paths; use query.centreId for Centre ids.
- use advanceFilter in the body for field-specific filters (name, email, status).
- If a multi-word name returns no rows, retry with one token (first or last name).
- Empty results do not prove the learner is missing from a Class. For lesson completion in a Class, use the Lesson Overall report with query.classId.
- Use advanceFilterSelect to limit returned fields when the user only needs specific columns.
- If several users match, this tool shows a picker and the turn ends. Wait for the user message that starts with "Selected learner". Use that _id. Do not call ask_question to choose a user, and do not pick the first match.
- Pass selection "multi" when the user asked for more than one learner. Pass purpose "show" when the list itself is the answer.
- Do not expose internal MongoDB ids unless the user needs them for a follow-up action.
- Use only returned data. Never invent names, emails, centres, or status values.
  `,
  querySchema: userInfoListSchema.query,
  bodySchema: userInfoListSchema.body,
  outputSchema: userInfoListSchema.output,
  execute: (input, auth) => listUsers(input.query, auth, input.body),
  present: {
    source: "users",
    entity: "Learner",
    plural: "Learners",
    rowSchema: userInfoRowSchema,
  },
});

import { createPaginatedTool } from "@/lib/tools/create-paginated-tool";

import { listClasses } from "./class.api";
import { classListSchema, classRowSchema } from "./schema";

export const classListTool = createPaginatedTool({
  description: `
List and search LMS Classes.

Use this tool when users ask about:
- Finding a Class by name or code
- Which Centres a Class belongs to
- Class status, dates, enrollment counts, or parent Course
- Looking up a Class id before other LMS operations

Important:
- Present "Class" in user-facing text (not "Intake" or "Course" unless referring to the parent Course).
- The response property "parent" is the parent Course; "courseCentre" means Centre (branch/company).
- query.centreId filters by Centre. query.parentCourseId filters by parent Course template. Never put a Class id in centreId.
- Use advanceFilter in the body to search by Class name or code (e.g. field "code" Equals / "name" Contains).
- When the follow-up is "users in this Class" / a Class roster, resolve the Class id here, then call the Class Users report with query.classId. Do not use get-users.
- When the follow-up is lesson completion for a named learner, resolve the Class id here, then call the Lesson Overall report with query.classId. Do not block on get-users.
- If several Classes match, this tool shows a picker and the turn ends. Wait for the user message that starts with "Selected class". Use that _id. Do not call ask_question to choose a Class, and do not pick the first match.
- Pass selection "multi" when the user asked for more than one Class. Pass purpose "show" when the list itself is the answer.
- Use advanceFilterSelect to limit returned fields when the user only needs specific columns (include _id when the Class id is needed next).
- Do not expose internal MongoDB ids unless the user needs them for a follow-up action.
- Use only returned data. Never invent Class names, codes, dates, or enrollment counts.
  `,
  querySchema: classListSchema.query,
  bodySchema: classListSchema.body,
  outputSchema: classListSchema.output,
  execute: (input, auth) => listClasses(input.query, auth, input.body),
  present: {
    source: "classes",
    entity: "Class",
    plural: "Classes",
    rowSchema: classRowSchema,
  },
});

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
  `,
  querySchema: classListSchema.query,
  bodySchema: classListSchema.body,
  outputSchema: classListSchema.output,
  widget: {
    entry: "Class",
    source: "classes",
    rowSchema: classRowSchema,
  },
  execute: (input, auth) => listClasses(input.query, auth, input.body),
});

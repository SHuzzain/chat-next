import { createPaginatedTool } from "@/lib/tools/create-paginated-tool";

import { listCourseCentresByAdvanceFilter } from "./centre.api";
import { courseCentreListSchema } from "./schema";

export const courseCentreListTool = createPaginatedTool({
  description: `
List and search LMS Centres (course centres).

Use this tool when users ask about:
- Centre names, codes, or contact details
- Which organisation or business type a centre belongs to
- Centre location (country, state, city)
- Finding a centre id before other LMS operations
- Centre status or admin-related centre metadata

Important:
- Present "Centre" in user-facing text (not "CourseCentre"). A Centre is a branch/company, never a Class.
- Populated fields such as organisation, businessType, centreType, country, state, city, and creator may include only the fields returned by the API.
- Use advanceFilter in the body to search by centre name, code, organisation, business type, or centre type.
- Use advanceFilterSelect to limit returned fields when the user only needs specific columns.
- If multiple Centres match and a follow-up needs a centre id, call ask_question with options whose labels embed each centre _id; do not pick the first match.
- Pass the selected Centre _id as query.centreId on other tools — never as a Class id.
- Do not expose internal MongoDB ids unless the user needs them for a follow-up action.
- Use only returned data. Never invent centre names, codes, or contact details.
  `,
  querySchema: courseCentreListSchema.query,
  bodySchema: courseCentreListSchema.body,
  outputSchema: courseCentreListSchema.output,
  execute: (input, auth) =>
    listCourseCentresByAdvanceFilter(input.query, auth, input.body),
});

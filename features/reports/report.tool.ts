import { createPaginatedTool } from "@/lib/tools/create-paginated-tool";
import {
  listClassEnrollmentAndProgressReports,
  listClassUsersReports,
  listLessonOverallReports,
  listUserClassScoreReports,
  listUserEnrollReports,
} from "./report.api";
import {
  reportUserEnrollSchema,
  reportUserClassScoreSchema,
  reportLessonOverallSchema,
  reportClassUsersSchema,
} from "./schema";
import { classEnrollmentAndProgressSchema } from "./schema/class-enrollment-and-progress";

export const userReportListTool = createPaginatedTool({
  description: `
  Retrieve the Learner Enrollment Summary Report.
    
  Use this tool when users ask about:
  - Learner details and enrollment summaries
  - Number of Classes assigned or enrolled to a learner
  - Number of Class enrollments completed by a learner
  - Learner registration dates and account status
  - Learner roles and associated Centres
  - Comparing enrollment and completion counts across learners
  
  Important:
  - query.centreId filters by Centre (branch/company). Never put a Class id in centreId.
  - Body/select use agent field centre (and centre.name). Prefer query.centreId over filtering on centre.
  - Use the exact frontend labels when presenting report results: "User Name", "Email", "Centre", "User Role", "Enrolled", "Completed", "Registered At", and "Status".
  - Interpret assignedCourses as the Enrolled count and completedCourses as the Completed count. These represent Class enrollment counts, not necessarily unique parent Courses.
  - Do not assume that all enrolled Classes are completed or that the counts represent unique Classes unless confirmed by the returned data.
  - Do not expose internal API field names or database IDs unless explicitly requested.
  - Use only the returned data. Never invent learner details, enrollment counts, or missing values.
  - If a requested field is missing, explain that the information is unavailable.
  `,
  querySchema: reportUserEnrollSchema.query,
  bodySchema: reportUserEnrollSchema.body,
  outputSchema: reportUserEnrollSchema.output,
  execute: (input, auth) =>
    listUserEnrollReports(input.query, auth, input.body),
});

export const userReportClassScoreTool = createPaginatedTool({
  description: `
  Retrieve the User Class Score and Progress Report.
  
  Use this tool when users ask about:
  - A learner's Class progress or enrollment status
  - Class enrollment and completion dates
  - Learner progress across Classes
  - A learner's role and associated Centre
  - Class completion information
  
  Important:
  - query.userId is required. Resolve it via get-users (or an exact id the user already gave). If several users match, get-users shows a picker. Wait for the "Selected learner" message and use that _id. Do not guess and do not call ask_question to choose a user.
  - To filter by Class, set query.classId (from list-classes). Never put a Class id in query.centreId or in advanceFilter field courseCentre.
  - query.centreId filters by Centre (branch/company) only.
  - Do not use advanceFilter on field "course" for Class id; use query.classId.
  - Use the exact frontend labels when presenting results: "User Name", "Class Name", "Centre", "User Role", "Progress", "Status", "Enrolled Date", and "Completed Date".
  - The API property named "course" in the response represents Class information. Do not assume it contains the parent Course.
  - Progress and score are different concepts. Progress is a percentage from 0 to 100; only report a score when the returned data includes one.
  - Distinguish the learner's account status from their Class enrollment status.
  - Do not expose internal API field names or database IDs unless explicitly requested.
  - Use only the returned data. Never invent learner details, progress percentages, dates, or statuses.
  - If a requested field is missing or unavailable, explain that the information is unavailable.
  `,
  querySchema: reportUserClassScoreSchema.query,
  bodySchema: reportUserClassScoreSchema.body,
  outputSchema: reportUserClassScoreSchema.output,
  execute: (input, auth) =>
    listUserClassScoreReports(input.query, auth, input.body),
});

export const lessonOverallReportListTool = createPaginatedTool({
  description: `
Retrieve the Lesson Overall Report for learners in a specific Class.

This is the primary tool when users ask whether a named Learner completed a specific Lesson in a Class
(e.g. "Class code R-CHECK, user vijaya kandi, lesson test assignment").

Workflow:
1. Resolve the Class id first (list-classes by name or code via advanceFilter).
2. If several Classes match, list-classes shows a picker and ends the turn. Wait for the "Selected class" message, then continue with that Class id. Do not call ask_question to choose a Class.
3. Call this tool with query.classId = that Class id. Do NOT require a successful get-users lookup first.
4. Prefer body.advanceFilter on field "user" (Contains) for the learner name.
5. Prefer body.advanceFilter on field "unit" (Contains) for the Lesson name; the API field "unit" means Lesson.
6. Interpret completion from returned startDate / endDate / totalDuration for matching rows.
   A row with both startDate and endDate indicates the Learner finished that Lesson activity window;
   missing dates means no recorded activity for that Lesson.

Important:
- A Class ID is required (query.classId). Obtain it from list-classes. When the picker is shown, use the id from the user's selection. Never guess an id.
- get-users is optional for this question type. If get-users returns no rows, still call this report with advanceFilter on user/unit.
- If a multi-word learner name returns no rows, retry advanceFilter with one token (e.g. "vijaya" or "kandi").
- Use advanceFilterSelect to limit columns when only completion status is needed (e.g. user, unit, startDate, endDate).
- Present "Lesson" in user-facing text (API field is "unit"). Present "Class" / "Centre" / "Learner" normally.
- Do not expose internal API field names or database IDs unless explicitly requested.
- Use only returned data. Never invent lesson names, dates, durations, or learner details.
  `,
  querySchema: reportLessonOverallSchema.query,
  bodySchema: reportLessonOverallSchema.body,
  outputSchema: reportLessonOverallSchema.output,
  execute: (input, auth) =>
    listLessonOverallReports(input.query, auth, input.body),
});

export const classEnrollmentAndProgressTool = createPaginatedTool({
  description: `
Retrieve the Class Enrollment and Progress Summary Report.

This report provides learner enrollment and progress statistics for each Class and its associated Centre.

Status interpretation:
- activeLearners: Yet to Start count
- inprogressLearners: In Progress count
- completedLearners: Completed count
- assignedLearners: Total enrolled learners count

Use this tool when users ask about:
- Learner enrollment counts by Class
- Class enrollment summaries
- Learner progress breakdowns
- Yet to Start, In Progress, or Completed counts
- Class progress by Centre
- Comparing enrollment or completion counts across Classes or Centres

Important:
- query.centreId filters by Centre (branch/company). Never put a Class id in centreId.
- query.parentCourseId filters by parent Course template, not by Class.
- Use the returned data to answer questions. Never invent or estimate counts.
- Use frontend terminology such as "Class", "Centre", "Learners", "Yet to Start", "In Progress", and "Completed".
- Do not expose internal API field names or database IDs unless explicitly requested.
- If the report does not return the information needed, explain what is unavailable rather than guessing.
- Do not assume that the total enrolled learner count equals the sum of the three progress counts unless the returned data confirms this.
`,
  querySchema: classEnrollmentAndProgressSchema.query,
  bodySchema: classEnrollmentAndProgressSchema.body,
  outputSchema: classEnrollmentAndProgressSchema.output,
  execute: (input, auth) =>
    listClassEnrollmentAndProgressReports(input.query, auth, input.body),
});

export const classUsersReportTool = createPaginatedTool({
  description: `
Retrieve the Class Users roster — learners enrolled in a specific Class.

THIS is the tool for "user list of class X" / "who is enrolled in class Y".
Do NOT use get-users for that question. get-users cannot filter by Class.

Workflow:
1. Resolve the Class with list-classes (name or code).
2. If several Classes match, wait for "Selected class" and use that _id.
3. Call this tool with query.classId = that Class id.
4. Optional query.centreId filters by Centre (branch/company) only — never put the Class id in centreId.

Important:
- query.classId is required.
- Present labels: "User Name", "Class Name", "Centre", "User Role", "Progress", "Status", "Enrolled Date", "Completed Date".
- Body filter/select and results use agent names: class, userCentre, user.centre (mapped to LMS course / userCourseCentres at the API boundary).
- Use only returned data. Never invent learner names or enrollment rows.
  `,
  querySchema: reportClassUsersSchema.query,
  bodySchema: reportClassUsersSchema.body,
  outputSchema: reportClassUsersSchema.output,
  execute: (input, auth) =>
    listClassUsersReports(input.query, auth, input.body),
});

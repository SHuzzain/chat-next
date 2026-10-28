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
  reportUserEnrollRowSchema,
  reportUserClassScoreSchema,
  reportUserClassScoreRowSchema,
  reportLessonOverallSchema,
  reportLessonOverallRowSchema,
  reportClassUsersSchema,
  reportClassUsersRowSchema,
} from "./schema";
import {
  classEnrollmentAndProgressRowSchema,
  classEnrollmentAndProgressSchema,
} from "./schema/class-enrollment-and-progress";

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
  - If a requested field is missing, explain that the information is unavailable.
  `,
  querySchema: reportUserEnrollSchema.query,
  bodySchema: reportUserEnrollSchema.body,
  outputSchema: reportUserEnrollSchema.output,
  widget: {
    entry: "Learner",
    source: "learner-enrollment-report",
    rowSchema: reportUserEnrollRowSchema,
  },
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
  `,
  querySchema: reportUserClassScoreSchema.query,
  bodySchema: reportUserClassScoreSchema.body,
  outputSchema: reportUserClassScoreSchema.output,
  widget: {
    entry: "Class enrollment",
    source: "user-class-score-report",
    rowSchema: reportUserClassScoreRowSchema,
  },
  execute: (input, auth) =>
    listUserClassScoreReports(input.query, auth, input.body),
});

export const lessonOverallReportListTool = createPaginatedTool({
  description: `
Retrieve the Lesson Overall Report for learners in a specific Class.

  `,
  querySchema: reportLessonOverallSchema.query,
  bodySchema: reportLessonOverallSchema.body,
  outputSchema: reportLessonOverallSchema.output,
  widget: {
    entry: "Lesson",
    source: "lesson-overall-report",
    rowSchema: reportLessonOverallRowSchema,
  },
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
`,
  querySchema: classEnrollmentAndProgressSchema.query,
  bodySchema: classEnrollmentAndProgressSchema.body,
  outputSchema: classEnrollmentAndProgressSchema.output,
  widget: {
    entry: "Class",
    source: "class-enrollment-report",
    rowSchema: classEnrollmentAndProgressRowSchema,
  },
  execute: (input, auth) =>
    listClassEnrollmentAndProgressReports(input.query, auth, input.body),
});

export const classUsersReportTool = createPaginatedTool({
  description: `
Retrieve the Class Users roster — learners enrolled in a specific Class.

Use this tool when users ask about:
- Who is enrolled in a Class
- Learner progress, score, or enrollment status inside one Class
- Enrollment dates and time spent in a Class
- Learner Centres for a Class roster

Requires query.classId (resolve via list-classes first).
  `,
  querySchema: reportClassUsersSchema.query,
  bodySchema: reportClassUsersSchema.body,
  outputSchema: reportClassUsersSchema.output,
  widget: {
    entry: "Learner",
    source: "class-users-report",
    rowSchema: reportClassUsersRowSchema,
  },
  execute: (input, auth) =>
    listClassUsersReports(input.query, auth, input.body),
});

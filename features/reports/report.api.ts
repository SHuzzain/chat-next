import type { LmsAuth } from "@/lib/auth";
import { canViewUserReport } from "@/lib/permissions";
import { lmsFetch } from "@/lib/tools/api-client";

import type {
  ClassEnrollmentAndProgress,
  ReportClassUsers,
  ReportLessonOverall,
  ReportLiveClass,
  ReportLiveSessionUser,
  ReportUserClassScore,
  ReportUserEnroll,
} from "./report.types";
import {
  classEnrollmentAndProgressSchema,
  classEnrollmentAndProgressWireRowSchema,
  classEnrollmentFields,
  classScoreFields,
  classUsersFields,
  enrollFields,
  lessonOverallFields,
  liveClassFields,
  liveSessionUserFields,
  reportClassUsersSchema,
  reportClassUsersWireRowSchema,
  reportLessonOverallSchema,
  reportLessonOverallWireRowSchema,
  reportLiveClassSchema,
  reportLiveClassWireRowSchema,
  reportLiveSessionUserSchema,
  reportLiveSessionUserWireRowSchema,
  reportUserClassScoreSchema,
  reportUserClassScoreWireRowSchema,
  reportUserEnrollSchema,
  reportUserEnrollWireRowSchema,
} from "./schema";

function warnRole(auth: LmsAuth) {
  if (!canViewUserReport(auth)) {
    console.warn(
      "user report is outside the advisory role list; LMS will decide",
    );
  }
}

export async function listUserEnrollReports(
  query: ReportUserEnroll["query"],
  auth: LmsAuth,
  body: ReportUserEnroll["body"],
): Promise<ReportUserEnroll["output"]> {
  const parsedQuery = reportUserEnrollSchema.query.parse(query);
  const parsedBody = reportUserEnrollSchema.body.parse(body ?? {});
  const wire = enrollFields.toWireRequest({
    query: parsedQuery as Record<string, unknown>,
    body: parsedBody as Record<string, unknown>,
  });

  warnRole(auth);
  const payload = await lmsFetch("reports/users", {
    method: "POST",
    query: wire.query,
    body: wire.body,
    auth,
  });
  return reportUserEnrollSchema.output.parse(
    enrollFields.readPage(reportUserEnrollWireRowSchema, payload),
  );
}

export async function listUserClassScoreReports(
  query: ReportUserClassScore["query"],
  auth: LmsAuth,
  body: ReportUserClassScore["body"],
): Promise<ReportUserClassScore["output"]> {
  const { userId, ...rest } = reportUserClassScoreSchema.query.parse(query);
  const parsedBody = reportUserClassScoreSchema.body.parse(body ?? {});
  const wire = classScoreFields.toWireRequest({
    query: rest as Record<string, unknown>,
    body: parsedBody as Record<string, unknown>,
  });
  warnRole(auth);
  const payload = await lmsFetch(`reports/users/${userId}/courses`, {
    method: "POST",
    query: wire.query,
    body: wire.body,
    auth,
  });
  return reportUserClassScoreSchema.output.parse(
    classScoreFields.readPage(reportUserClassScoreWireRowSchema, payload),
  );
}

export async function listLessonOverallReports(
  query: ReportLessonOverall["query"],
  auth: LmsAuth,
  body: ReportLessonOverall["body"],
): Promise<ReportLessonOverall["output"]> {
  const parseQuery = reportLessonOverallSchema.query.parse(query);
  const parsedBody = reportLessonOverallSchema.body.parse(body ?? {});
  const wire = lessonOverallFields.toWireRequest({
    query: parseQuery as Record<string, unknown>,
    body: parsedBody as Record<string, unknown>,
  });

  warnRole(auth);
  const payload = await lmsFetch("report/get-overall-report", {
    method: "POST",
    query: wire.query,
    body: wire.body,
    auth,
  });
  return reportLessonOverallSchema.output.parse(
    lessonOverallFields.readPage(reportLessonOverallWireRowSchema, payload),
  );
}

export async function listClassEnrollmentAndProgressReports(
  query: ClassEnrollmentAndProgress["query"],
  auth: LmsAuth,
  body: ClassEnrollmentAndProgress["body"],
) {
  const parseQuery = classEnrollmentAndProgressSchema.query.parse(query);
  const parsedBody = classEnrollmentAndProgressSchema.body.parse(body ?? {});
  const wire = classEnrollmentFields.toWireRequest({
    query: parseQuery as Record<string, unknown>,
    body: parsedBody as Record<string, unknown>,
  });
  warnRole(auth);
  const payload = await lmsFetch("reports/courses", {
    method: "POST",
    query: wire.query,
    body: wire.body,
    auth,
  });
  return classEnrollmentAndProgressSchema.output.parse(
    classEnrollmentFields.readPage(
      classEnrollmentAndProgressWireRowSchema,
      payload,
    ),
  );
}

export async function listClassUsersReports(
  query: ReportClassUsers["query"],
  auth: LmsAuth,
  body: ReportClassUsers["body"],
): Promise<ReportClassUsers["output"]> {
  const { classId, ...rest } = reportClassUsersSchema.query.parse(query);
  const parsedBody = reportClassUsersSchema.body.parse(body ?? {});
  const wire = classUsersFields.toWireRequest({
    query: rest as Record<string, unknown>,
    body: parsedBody as Record<string, unknown>,
  });
  warnRole(auth);
  const payload = await lmsFetch(`reports/courses/${classId}/users`, {
    method: "POST",
    query: wire.query,
    body: wire.body,
    auth,
  });
  return reportClassUsersSchema.output.parse(
    classUsersFields.readPage(reportClassUsersWireRowSchema, payload),
  );
}

export async function listLiveClassReports(
  query: ReportLiveClass["query"],
  auth: LmsAuth,
  body: ReportLiveClass["body"],
): Promise<ReportLiveClass["output"]> {
  const { classId, ...rest } = reportLiveClassSchema.query.parse(query);
  const parsedBody = reportLiveClassSchema.body.parse(body ?? {});
  // LMS expects courseId (Class id), not the default FieldAlias classId→course.
  const wire = liveClassFields.toWireRequest({
    query: {
      ...(rest as Record<string, unknown>),
      ...(classId ? { courseId: classId } : {}),
    },
    body: parsedBody as Record<string, unknown>,
  });
  warnRole(auth);
  const payload = await lmsFetch("reports/get-course-liveclasses-reports", {
    method: "POST",
    query: wire.query,
    body: wire.body,
    auth,
  });
  return reportLiveClassSchema.output.parse(
    liveClassFields.readPage(reportLiveClassWireRowSchema, payload),
  );
}

export async function listLiveClassSessionUsers(
  query: ReportLiveSessionUser["query"],
  auth: LmsAuth,
  body: ReportLiveSessionUser["body"],
): Promise<ReportLiveSessionUser["output"]> {
  const { eventId, ...rest } =
    reportLiveSessionUserSchema.query.parse(query);
  const parsedBody = reportLiveSessionUserSchema.body.parse(body ?? {});
  const wire = liveSessionUserFields.toWireRequest({
    query: rest as Record<string, unknown>,
    body: parsedBody as Record<string, unknown>,
  });
  warnRole(auth);
  const payload = await lmsFetch(`session-users/${eventId}/users`, {
    method: "POST",
    query: wire.query,
    body: wire.body,
    auth,
  });
  return reportLiveSessionUserSchema.output.parse(
    liveSessionUserFields.readPage(
      reportLiveSessionUserWireRowSchema,
      payload,
    ),
  );
}

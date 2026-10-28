import type { LmsAuth } from "@/lib/auth";
import { canViewUserReport } from "@/lib/permissions";
import { lmsFetch } from "@/lib/tools/api-client";

import type {
  ClassEnrollmentAndProgress,
  ReportClassUsers,
  ReportLessonOverall,
  ReportUserClassScore,
  ReportUserEnroll,
} from "./report.types";
import {
  classScoreFields,
  classUsersFields,
  enrollFields,
  reportClassUsersSchema,
  reportClassUsersWireRowSchema,
  reportLessonOverallSchema,
  reportUserClassScoreSchema,
  reportUserClassScoreWireRowSchema,
  reportUserEnrollSchema,
  reportUserEnrollWireRowSchema,
} from "./schema";
import { classEnrollmentAndProgressSchema } from "./schema/class-enrollment-and-progress";

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

  warnRole(auth);
  const payload = await lmsFetch("report/get-overall-report", {
    method: "POST",
    query: parseQuery,
    body: parsedBody,
    auth,
  });
  return reportLessonOverallSchema.output.parse(payload);
}

export async function listClassEnrollmentAndProgressReports(
  query: ClassEnrollmentAndProgress["query"],
  auth: LmsAuth,
  body: ClassEnrollmentAndProgress["body"],
) {
  const parseQuery = classEnrollmentAndProgressSchema.query.parse(query);
  const parsedBody = classEnrollmentAndProgressSchema.body.parse(body ?? {});
  warnRole(auth);
  const payload = await lmsFetch("reports/courses", {
    method: "POST",
    query: parseQuery,
    body: parsedBody,
    auth,
  });
  return classEnrollmentAndProgressSchema.output.parse(payload);
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

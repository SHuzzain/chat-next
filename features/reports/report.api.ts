import type { LmsAuth } from "@/lib/auth";
import { paramSchema } from "@/lib/common-zod";
import { canViewUserReport } from "@/lib/permissions";
import { lmsFetch } from "@/lib/tools/api-client";

import type {
  ClassEnrollmentAndProgress,
  ReportLessonOverall,
  ReportUserClassScore,
  ReportUserEnroll,
} from "./report.types";
import {
  reportLessonOverallSchema,
  reportUserClassScoreSchema,
  reportUserEnrollSchema,
} from "./schema";
import { classEnrollmentAndProgressSchema } from "./schema/class-enrollment-and-progress";

function warnRole(auth: LmsAuth) {
  if (!canViewUserReport(auth)) {
    console.warn(
      "user report is outside the advisory role list; LMS will decide",
    );
  }
}

export function toApiField(
  field: string,
  fieldAliases: Record<string, string>,
): string {
  return fieldAliases[field] ?? field;
}

export async function listUserEnrollReports(
  query: ReportUserEnroll["query"],
  auth: LmsAuth,
  body: ReportUserEnroll["body"],
): Promise<ReportUserEnroll["output"]> {
  const parseQuery = reportUserEnrollSchema.query.parse(query);
  const parsedBody = reportUserEnrollSchema.body.parse(body ?? {});
  const apiRequest = {
    ...parsedBody,
    advanceFilter: parsedBody.advanceFilter?.map((filter) => ({
      ...filter,
      field: toApiField(filter.field, reportUserEnrollSchema.fieldAliases),
    })),
    advanceFilterSelect: parsedBody.advanceFilterSelect?.map((select) =>
      toApiField(select, reportUserEnrollSchema.fieldAliases),
    ),
  };

  warnRole(auth);
  const payload = await lmsFetch("reports/users", {
    method: "POST",
    query: parseQuery,
    body: apiRequest,
    auth,
  });
  return reportUserEnrollSchema.output.parse(payload);
}

export async function listUserClassScoreReports(
  query: ReportUserClassScore["query"],
  auth: LmsAuth,
  body: ReportUserClassScore["body"],
): Promise<ReportUserClassScore["output"]> {
  const parseQuery = reportUserClassScoreSchema.query.parse(query);
  const { id } = paramSchema.parse({ id: parseQuery.userId });
  delete parseQuery.userId;
  const parsedBody = reportUserClassScoreSchema.body.parse(body ?? {});
  warnRole(auth);
  const payload = await lmsFetch(`reports/users/${id}/courses`, {
    method: "POST",
    query: parseQuery,
    body: parsedBody,
    auth,
  });
  return reportUserClassScoreSchema.output.parse(payload);
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

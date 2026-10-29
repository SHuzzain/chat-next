import { z } from "zod";

import { listClasses } from "@/features/class/class.api";
import { classListSchema } from "@/features/class/schema";
import { classRowSchema } from "@/features/class/schema/class-list";
import { listCourseCentresByAdvanceFilter } from "@/features/centres/centre.api";
import {
  courseCentreListSchema,
  courseCentreRowSchema,
} from "@/features/centres/schema";
import {
  listClassEnrollmentAndProgressReports,
  listClassUsersReports,
  listLessonOverallReports,
  listUserClassScoreReports,
  listUserEnrollReports,
} from "@/features/reports/report.api";
import {
  reportClassUsersRowSchema,
  reportClassUsersSchema,
  reportLessonOverallRowSchema,
  reportLessonOverallSchema,
  reportUserClassScoreRowSchema,
  reportUserClassScoreSchema,
  reportUserEnrollRowSchema,
  reportUserEnrollSchema,
} from "@/features/reports/schema";
import {
  classEnrollmentAndProgressRowSchema,
  classEnrollmentAndProgressSchema,
} from "@/features/reports/schema/class-enrollment-and-progress";
import { listUsers } from "@/features/user/user.api";
import { userInfoListSchema, userInfoRowSchema } from "@/features/user/schema";
import type { LmsAuth } from "@/lib/auth";

export type WidgetListPage = {
  data?: unknown[];
  totalItems?: number | null;
  totalPage?: number | null;
  currentPage?: number | null;
};

export type WidgetSource = {
  list: (
    query: unknown,
    auth: LmsAuth,
    body: unknown,
  ) => Promise<WidgetListPage>;
  query: z.ZodType;
  body: z.ZodType;
  rowSchema: z.ZodType;
};

function asList(
  list: (
    query: never,
    auth: LmsAuth,
    body: never,
  ) => Promise<WidgetListPage>,
): WidgetSource["list"] {
  return (query, auth, body) =>
    list(query as never, auth, body as never);
}

export const widgetSources = {
  users: {
    list: asList(listUsers),
    query: userInfoListSchema.query,
    body: userInfoListSchema.body,
    rowSchema: userInfoRowSchema,
  },
  classes: {
    list: asList(listClasses),
    query: classListSchema.query,
    body: classListSchema.body,
    rowSchema: classRowSchema,
  },
  centres: {
    list: asList(listCourseCentresByAdvanceFilter),
    query: courseCentreListSchema.query,
    body: courseCentreListSchema.body,
    rowSchema: courseCentreRowSchema,
  },
  "learner-enrollment-report": {
    list: asList(listUserEnrollReports),
    query: reportUserEnrollSchema.query,
    body: reportUserEnrollSchema.body,
    rowSchema: reportUserEnrollRowSchema,
  },
  "user-class-score-report": {
    list: asList(listUserClassScoreReports),
    query: reportUserClassScoreSchema.query,
    body: reportUserClassScoreSchema.body,
    rowSchema: reportUserClassScoreRowSchema,
  },
  "lesson-overall-report": {
    list: asList(listLessonOverallReports),
    query: reportLessonOverallSchema.query,
    body: reportLessonOverallSchema.body,
    rowSchema: reportLessonOverallRowSchema,
  },
  "class-enrollment-report": {
    list: asList(listClassEnrollmentAndProgressReports),
    query: classEnrollmentAndProgressSchema.query,
    body: classEnrollmentAndProgressSchema.body,
    rowSchema: classEnrollmentAndProgressRowSchema,
  },
  "class-users-report": {
    list: asList(listClassUsersReports),
    query: reportClassUsersSchema.query,
    body: reportClassUsersSchema.body,
    rowSchema: reportClassUsersRowSchema,
  },
} as const satisfies Record<string, WidgetSource>;

export type WidgetSourceKey = keyof typeof widgetSources;

export const widgetSourceKeys = Object.keys(
  widgetSources,
) as WidgetSourceKey[];

export const widgetSourceSchema = z.enum(
  widgetSourceKeys as [WidgetSourceKey, ...WidgetSourceKey[]],
);

export function getWidgetSource(source: string): WidgetSource {
  if (!(source in widgetSources)) {
    throw new Error(`Unknown widget source: ${source}`);
  }
  return widgetSources[source as WidgetSourceKey];
}

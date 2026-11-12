import type { z } from "zod";

import type {
  classEnrollmentAndProgressSchema,
  reportClassUsersSchema,
  reportLessonOverallSchema,
  reportLiveClassSchema,
  reportLiveSessionUserSchema,
  reportUserClassScoreSchema,
  reportUserEnrollSchema,
} from "./schema";

export type ReportUserEnroll = {
  query: z.infer<typeof reportUserEnrollSchema.query>;
  body: z.infer<typeof reportUserEnrollSchema.body>;
  output: z.infer<typeof reportUserEnrollSchema.output>;
};

export type ReportUserClassScore = {
  query: z.infer<typeof reportUserClassScoreSchema.query>;
  body: z.infer<typeof reportUserClassScoreSchema.body>;
  output: z.infer<typeof reportUserClassScoreSchema.output>;
};

export type ReportLessonOverall = {
  query: z.infer<typeof reportLessonOverallSchema.query>;
  body: z.infer<typeof reportLessonOverallSchema.body>;
  output: z.infer<typeof reportLessonOverallSchema.output>;
};

export type ClassEnrollmentAndProgress = {
  query: z.infer<typeof classEnrollmentAndProgressSchema.query>;
  body: z.infer<typeof classEnrollmentAndProgressSchema.body>;
  output: z.infer<typeof classEnrollmentAndProgressSchema.output>;
};

export type ReportClassUsers = {
  query: z.infer<typeof reportClassUsersSchema.query>;
  body: z.infer<typeof reportClassUsersSchema.body>;
  output: z.infer<typeof reportClassUsersSchema.output>;
};

export type ReportLiveClass = {
  query: z.infer<typeof reportLiveClassSchema.query>;
  body: z.infer<typeof reportLiveClassSchema.body>;
  output: z.infer<typeof reportLiveClassSchema.output>;
};

export type ReportLiveSessionUser = {
  query: z.infer<typeof reportLiveSessionUserSchema.query>;
  body: z.infer<typeof reportLiveSessionUserSchema.body>;
  output: z.infer<typeof reportLiveSessionUserSchema.output>;
};

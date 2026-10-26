import type { z } from "zod";

import type {
  reportLessonOverallSchema,
  reportUserClassScoreSchema,
  reportUserEnrollSchema,
} from "./schema";
import { classEnrollmentAndProgressSchema } from "./schema/class-enrollment-and-progress";
import type { reportClassUsersSchema } from "./schema/class-users.schema";

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

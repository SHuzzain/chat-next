import { z } from "zod";

import { sourceOrginSchema } from "@/features/organisation/schema";
import { mongoIdSchema, populatedRefSchema } from "@/lib/zod/primitives";

export const courseStatusSchema = z.enum([
  "ACTIVE",
  "INACTIVE",
  "DELETED",
  "WAITING_FOR_APPROVAL",
]);

const dateRangeSchema = z.object({
  begin: z.coerce.date().optional(),
  end: z.coerce.date().optional(),
});

const courseCompetencySchema = z.looseObject({
  _id: mongoIdSchema.optional(),
  coreCompetency: populatedRefSchema.optional(),
  masteryLevel: z.array(populatedRefSchema).optional(),
});

const whiteBoardImageSchema = z.looseObject({
  _id: mongoIdSchema.optional(),
  url: z.string().optional(),
  user: populatedRefSchema,
});

export const courseSchema = z.looseObject({
  _id: mongoIdSchema,
  name: z.string(),
  category: populatedRefSchema.optional(),
  courseCentre: z.array(populatedRefSchema).optional(),
  description: z.string().optional(),
  thumbnail: z.string().optional(),
  whiteBoardImages: z.array(whiteBoardImageSchema).optional(),
  creator: populatedRefSchema,
  teachingLanguage: populatedRefSchema.optional(),
  code: z.string().optional(),
  oldCode: z.string().optional(),
  price: z.number().optional(),
  videoIntro: z.string().optional(),
  parent: populatedRefSchema.optional(),
  rulesAndPath: populatedRefSchema.optional(),
  greatBook: populatedRefSchema.optional(),
  competencies: z.array(courseCompetencySchema).optional(),
  status: courseStatusSchema.optional(),
  time: dateRangeSchema.optional(),
  publishDate: z.coerce.date().optional(),
  totalIntakeTime: z.number().optional(),
  totalHours: z.number().optional(),
  totalEnrolledUsers: z.number().optional(),
  totalPrice: z.number().optional(),
  timezone: z.string().optional(),
  dashboardDisplay: z.boolean().optional(),
  capacity: z.number().optional(),
  userEnrollmentPoints: z.number().optional(),
  enrollType: z.string().optional(),
  isPinned: z.boolean().optional(),
  sourceOrgin: sourceOrginSchema.optional(),
  elmssCourseId: z.string().optional(),
  elmssIntakeId: z.string().optional(),
  attendancePercentage: z.string().optional(),
  gradeBook: z
    .object({
      GPA_Applicable: z.boolean().optional(),
      creditUnits: z.number().optional(),
    })
    .optional(),
  gradeBookModeratedMark: z.string().optional(),
  programArea: z.string().optional(),
  cluster: z.string().optional(),
  deliveryMode: z.string().optional(),
  enrolmentDate: dateRangeSchema.optional(),
  enrolmentEligibility: z.string().optional(),
  vectors: z.array(z.number()).optional(),
  vectorId: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export type CourseStatus = z.infer<typeof courseStatusSchema>;
export type Course = z.infer<typeof courseSchema>;

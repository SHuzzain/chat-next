import {
  ISODateSchema,
  lmsListBodySchema,
  lmsPageSchema,
  mongoIdSchema,
} from "@/lib/common-zod";
import z from "zod";
import { courseCentreRefSchema } from "@/features/centres/schema";
import {
  paginationQuerySchema,
  withAllowedSort,
} from "@/lib/tools/api-pagination";
import {
  CENTRE_ID_DESCRIBE,
  PARENT_COURSE_ID_DESCRIBE,
} from "@/lib/tools/api-wire";

const centreRefSchema = courseCentreRefSchema;

const classStatusSchema = z.enum(["ACTIVE", "INACTIVE"]);

const ClassEnrollmentAndProgressRowSchema = z.object({
  _id: mongoIdSchema.optional().describe("Internal ID of the Class"),

  creator: mongoIdSchema
    .optional()
    .describe("ID of the user who created the Class"),

  createdAt: ISODateSchema.optional().describe("Date the Class was created"),

  status: classStatusSchema.optional().describe("Current status of the Class"),

  class: z.string().optional().describe("Class name displayed in the LMS"),

  assignedLearners: z
    .number()
    .optional()
    .describe("Total number of learners enrolled in the Class"),

  assignedLearnersCount: z.array(
    z.object({
      totalUsers: z
        .number()
        .optional()
        .describe("Number of learners represented by this entry"),
      _id: mongoIdSchema
        .optional()
        .describe("User ID associated with this entry"),
    }),
  ),

  courseCentre: z
    .array(centreRefSchema.optional())
    .optional()
    .describe(
      "Centres (branch/company) associated with the Class. LMS field courseCentre means Centre, never Class. Prefer query.centreId to filter.",
    ),

  activeLearners: z
    .number()
    .optional()
    .describe("Number of learners whose progress status is Yet to Start"),

  activeLearnersCount: z.array(
    z.object({
      totalUsers: z
        .number()
        .optional()
        .describe("Number of learners represented by this entry"),
      _id: mongoIdSchema
        .optional()
        .describe("User ID associated with this entry"),
    }),
  ),

  inprogressLearners: z
    .number()
    .optional()
    .describe("Number of learners whose progress status is In Progress"),

  inprogressLearnersCount: z
    .array(
      z.object({
        totalUsers: z
          .number()
          .optional()
          .describe("Number of learners represented by this entry"),
        _id: mongoIdSchema
          .optional()
          .describe("User ID associated with this entry"),
      }),
    )
    .optional(),

  completedLearners: z
    .number()
    .optional()
    .describe("Number of learners who have completed the Class"),

  completedLearnersCount: z
    .array(
      z.object({
        totalUsers: z
          .number()
          .optional()
          .describe("Number of learners represented by this entry"),
        _id: mongoIdSchema
          .optional()
          .describe("User ID associated with this entry"),
      }),
    )
    .optional(),
});

const ClassEnrollmentAndProgressQuerySchema = withAllowedSort(
  paginationQuerySchema.extend({
    centreId: mongoIdSchema.describe(CENTRE_ID_DESCRIBE).optional(),
    parentCourseId: mongoIdSchema
      .describe(PARENT_COURSE_ID_DESCRIBE)
      .optional(),
  }),
  ClassEnrollmentAndProgressRowSchema,
);

const ClassEnrollmentAndProgressBodySchema = lmsListBodySchema(
  ClassEnrollmentAndProgressRowSchema,
);

export const classEnrollmentAndProgressSchema = {
  output: lmsPageSchema(ClassEnrollmentAndProgressRowSchema),
  query: ClassEnrollmentAndProgressQuerySchema,
  body: ClassEnrollmentAndProgressBodySchema,
};

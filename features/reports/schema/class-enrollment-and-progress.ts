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
  FieldAlias,
  PARENT_COURSE_ID_DESCRIBE,
} from "@/lib/tools/api-wire";

import { centreAlias } from "./aliases";

const centreRefSchema = courseCentreRefSchema;

const classStatusSchema = z.enum(["ACTIVE", "INACTIVE"]);

const learnerCountEntrySchema = z.object({
  totalUsers: z
    .number()
    .optional()
    .describe("Number of learners represented by this entry"),
  _id: mongoIdSchema.optional().describe("User ID associated with this entry"),
});

/** Agent path → LMS path. `class` is already the wire display-name key. */
export const classEnrollmentFields = new FieldAlias({
  ...centreAlias,
});

/** Agent-facing row for POST /reports/courses. */
export const classEnrollmentAndProgressRowSchema = z.object({
  _id: mongoIdSchema
    .optional()
    .describe("Internal ID of the Class")
    .meta({ ui: { role: "value" } }),

  creator: mongoIdSchema
    .optional()
    .describe("ID of the user who created the Class"),

  createdAt: ISODateSchema.optional().describe("Date the Class was created"),

  status: classStatusSchema.optional().describe("Current status of the Class"),

  class: z
    .string()
    .optional()
    .describe("Class name displayed in the LMS")
    .meta({ ui: { roles: ["label", "search"] } }),

  assignedLearners: z
    .number()
    .optional()
    .describe("Total number of learners enrolled in the Class"),

  assignedLearnersCount: z.array(learnerCountEntrySchema),

  centre: z
    .array(centreRefSchema.optional())
    .optional()
    .describe("Centres associated with the Class"),

  activeLearners: z
    .number()
    .optional()
    .describe("Number of learners whose progress status is Yet to Start"),

  activeLearnersCount: z.array(learnerCountEntrySchema),

  inprogressLearners: z
    .number()
    .optional()
    .describe("Number of learners whose progress status is In Progress"),

  inprogressLearnersCount: z.array(learnerCountEntrySchema).optional(),

  completedLearners: z
    .number()
    .optional()
    .describe("Number of learners who have completed the Class"),

  completedLearnersCount: z.array(learnerCountEntrySchema).optional(),
});

/** LMS wire row for POST /reports/courses. */
export const classEnrollmentAndProgressWireRowSchema = z.object({
  _id: mongoIdSchema.optional(),
  creator: mongoIdSchema.optional(),
  createdAt: ISODateSchema.optional(),
  status: classStatusSchema.optional(),
  class: z.string().optional(),
  assignedLearners: z.number().optional(),
  assignedLearnersCount: z.array(learnerCountEntrySchema),
  courseCentre: z.array(centreRefSchema.optional()).optional(),
  activeLearners: z.number().optional(),
  activeLearnersCount: z.array(learnerCountEntrySchema),
  inprogressLearners: z.number().optional(),
  inprogressLearnersCount: z.array(learnerCountEntrySchema).optional(),
  completedLearners: z.number().optional(),
  completedLearnersCount: z.array(learnerCountEntrySchema).optional(),
});

const ClassEnrollmentAndProgressQuerySchema = withAllowedSort(
  paginationQuerySchema.extend({
    centreId: mongoIdSchema.describe(CENTRE_ID_DESCRIBE).optional(),
    parentCourseId: mongoIdSchema
      .describe(PARENT_COURSE_ID_DESCRIBE)
      .optional(),
  }),
  classEnrollmentAndProgressRowSchema,
);

const ClassEnrollmentAndProgressBodySchema = lmsListBodySchema(
  classEnrollmentAndProgressRowSchema,
);

export const classEnrollmentAndProgressSchema = {
  output: lmsPageSchema(classEnrollmentAndProgressRowSchema),
  query: ClassEnrollmentAndProgressQuerySchema,
  body: ClassEnrollmentAndProgressBodySchema,
};

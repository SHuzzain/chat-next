import { z } from "zod";

import { courseCentreRefSchema } from "@/features/centres/schema";
import {
  ISODateSchema,
  lmsEmailSchema,
  mongoIdSchema,
  populatedRefSchema,
} from "@/lib/zod/primitives";
import { lmsListBodySchema } from "@/lib/tools/api-request";
import {
  paginationQuerySchema,
  withAllowedSort,
} from "@/lib/tools/api-pagination";
import { lmsPageSchema } from "@/lib/tools/api-response";
import {
  CENTRE_ID_DESCRIBE,
  CLASS_ID_DESCRIBE,
  FieldAlias,
} from "@/lib/tools/api-wire";

const reportStatusSchema = z.enum(["ACTIVE", "INACTIVE"]);

const classUserStatusSchema = z.enum([
  "ACTIVE",
  "INACTIVE",
  "DELETED",
  "COMPLETED",
  "IN_PROGRESS",
]);

const centreOrIdSchema = z.union([mongoIdSchema, courseCentreRefSchema]);

const centreNameRefSchema = z.looseObject({
  _id: mongoIdSchema.optional(),
  name: z.string().optional(),
  code: z.string().optional(),
});

/**
 * On this endpoint LMS `course` means Class, and `userCourseCentres` means
 * the learner's Centres for the enrollment.
 */
export const classUsersFields = new FieldAlias({
  class: "course",
  "class.name": "course.name",
  "class.code": "course.code",
  "class._id": "course._id",
  "class.status": "course.status",
  "class.centre": "course.courseCentre",
  userCentre: "userCourseCentres",
  "userCentre.name": "userCourseCentres.name",
  "userCentre._id": "userCourseCentres._id",
  "userCentre.code": "userCourseCentres.code",
  centre: "courseCentre",
  "centre.name": "courseCentre.name",
  "centre._id": "courseCentre._id",
  "centre.code": "courseCentre.code",
  "user.centre": "user.courseCentre",
});

/** Agent-facing row (filters, select, widget roles, final output). */
export const reportClassUsersRowSchema = z.looseObject({
  _id: mongoIdSchema
    .optional()
    .describe("Class enrollment record id")
    .meta({ ui: { role: "value" } }),
  progress: z
    .number()
    .min(0)
    .max(100)
    .optional()
    .describe("Progress %")
    .meta({ ui: { role: "column" } }),
  status: classUserStatusSchema
    .optional()
    .describe("Enrollment status for this Class"),
  selfLearningProgress: z.number().optional(),
  selfLearningStatus: z.string().optional(),
  score: z
    .number()
    .optional()
    .describe("Score %")
    .meta({ ui: { role: "column" } }),
  userRole: z.string().optional().describe("Role in the Class, e.g. LEARNER"),
  enrolledDate: ISODateSchema.optional().describe(
    "Date the learner enrolled in the Class",
  ),
  completionDate: ISODateSchema.nullable().optional(),
  intakeTotalHours: z.union([z.number(), z.string()]).optional(),
  isSuspension: z.boolean().optional(),
  totalCourseTime: z
    .union([z.number(), z.string()])
    .optional()
    .describe("Total time the learner spent in the Class"),
  userCentre: z
    .array(centreNameRefSchema)
    .optional()
    .describe("Centres for this enrollment"),
  class: z
    .looseObject({
      _id: mongoIdSchema.optional(),
      name: z.string().optional(),
      code: z.string().optional(),
      status: z.string().optional(),
      centre: z.array(centreOrIdSchema).optional(),
    })
    .optional()
    .describe("Class for this enrollment"),
  user: z
    .looseObject({
      _id: mongoIdSchema.optional(),
      fullName: z
        .string()
        .optional()
        .meta({ ui: { roles: ["label", "search"] } }),
      email: lmsEmailSchema.meta({ ui: { role: "column" } }),
      status: reportStatusSchema.optional(),
      centre: z.array(centreOrIdSchema).optional(),
    })
    .optional()
    .describe("Learner enrolled in the Class"),
  completedBy: populatedRefSchema.optional(),
  completedByUser: z.looseObject({ _id: mongoIdSchema.optional() }).optional(),
});

/** LMS wire row for POST /reports/courses/:id/users. */
export const reportClassUsersWireRowSchema = z.looseObject({
  _id: mongoIdSchema.optional(),
  progress: z.number().min(0).max(100).optional(),
  status: classUserStatusSchema.optional(),
  selfLearningProgress: z.number().optional(),
  selfLearningStatus: z.string().optional(),
  score: z.number().optional(),
  userRole: z.string().optional(),
  enrolledDate: ISODateSchema.optional(),
  completionDate: ISODateSchema.nullable().optional(),
  intakeTotalHours: z.union([z.number(), z.string()]).optional(),
  isSuspension: z.boolean().optional(),
  totalCourseTime: z.union([z.number(), z.string()]).optional(),
  userCourseCentres: z.array(centreNameRefSchema).optional(),
  course: z
    .looseObject({
      _id: mongoIdSchema.optional(),
      name: z.string().optional(),
      code: z.string().optional(),
      status: z.string().optional(),
      courseCentre: z.array(centreOrIdSchema).optional(),
    })
    .optional(),
  user: z
    .looseObject({
      _id: mongoIdSchema.optional(),
      fullName: z.string().optional(),
      email: lmsEmailSchema,
      status: reportStatusSchema.optional(),
      courseCentre: z.array(centreOrIdSchema).optional(),
    })
    .optional(),
  completedBy: populatedRefSchema.optional(),
  completedByUser: z.looseObject({ _id: mongoIdSchema.optional() }).optional(),
});

const reportClassUsersQuerySchema = withAllowedSort(
  paginationQuerySchema.extend({
    classId: mongoIdSchema.describe(CLASS_ID_DESCRIBE),
    centreId: mongoIdSchema.describe(CENTRE_ID_DESCRIBE).optional(),
  }),
  reportClassUsersRowSchema,
);

export const reportClassUsersSchema = {
  query: reportClassUsersQuerySchema,
  body: lmsListBodySchema(reportClassUsersRowSchema),
  output: lmsPageSchema(reportClassUsersRowSchema),
};

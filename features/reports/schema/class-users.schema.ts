import { z } from "zod";

import { courseCentreRefSchema } from "@/features/centres/schema";
import {
  ISODateSchema,
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
  type FieldAliases,
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

/** Agent-facing row (Eve input filters + final output). */
const reportClassUsersAgentRowSchema = z.looseObject({
  _id: mongoIdSchema.optional().describe("Class enrollment record id"),
  progress: z
    .number()
    .min(0)
    .max(100)
    .optional()
    .describe("Learner progress percentage in the Class"),
  status: classUserStatusSchema
    .optional()
    .describe("Enrollment status for this Class"),
  selfLearningProgress: z.number().optional(),
  selfLearningStatus: z.string().optional(),
  score: z.number().optional(),
  userRole: z.string().optional().describe("Role in the Class, e.g. LEARNER"),
  enrolledDate: ISODateSchema.optional(),
  completionDate: ISODateSchema.nullable().optional(),
  intakeTotalHours: z.union([z.number(), z.string()]).optional(),
  isSuspension: z.boolean().optional(),
  totalCourseTime: z.union([z.number(), z.string()]).optional(),
  userCentre: z
    .array(
      z.looseObject({
        _id: mongoIdSchema.optional(),
        name: z.string().optional(),
        code: z.string().optional(),
      }),
    )
    .optional()
    .describe("Centres for this enrollment (branch/company). Not a Class."),
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
      fullName: z.string().optional(),
      email: z.string().optional(),
      status: reportStatusSchema.optional(),
      centre: z.array(centreOrIdSchema).optional(),
    })
    .optional()
    .describe("Learner enrolled in the Class"),
  completedBy: populatedRefSchema.optional(),
  completedByUser: z.looseObject({ _id: mongoIdSchema.optional() }).optional(),
});

/** LMS wire row. */
const reportClassUsersWireRowSchema = z.looseObject({
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
  userCourseCentres: z
    .array(z.looseObject({ _id: mongoIdSchema.optional() }))
    .optional(),
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
      email: z.string().optional(),
      status: reportStatusSchema.optional(),
      courseCentre: z.array(centreOrIdSchema).optional(),
    })
    .optional(),
  completedBy: populatedRefSchema.optional(),
  completedByUser: z.looseObject({ _id: mongoIdSchema.optional() }).optional(),
});

/** On this endpoint `course` means Class. */
const reportClassUsersFieldAliases: FieldAliases = {
  class: "course",
  "class.name": "course.name",
  "class.code": "course.code",
  "class._id": "course._id",
  "class.status": "course.status",
  "class.centre": "course.courseCentre",
  userCentre: "userCourseCentres",
  "userCentre.name": "userCourseCentres.name",
  "userCentre._id": "userCourseCentres._id",
  centre: "courseCentre",
  "user.centre": "user.courseCentre",
};

const reportClassUsersQuerySchema = withAllowedSort(
  paginationQuerySchema.extend({
    classId: mongoIdSchema.describe(
      `${CLASS_ID_DESCRIBE} Required. Path id for POST /reports/courses/:id/users.`,
    ),
    centreId: mongoIdSchema.describe(CENTRE_ID_DESCRIBE).optional(),
  }),
  reportClassUsersAgentRowSchema,
);

export const reportClassUsersRowSchema = reportClassUsersAgentRowSchema;

export const reportClassUsersSchema = {
  query: reportClassUsersQuerySchema,
  body: lmsListBodySchema(reportClassUsersAgentRowSchema),
  output: lmsPageSchema(reportClassUsersAgentRowSchema),
  wireOutput: lmsPageSchema(reportClassUsersWireRowSchema),
  fieldAliases: reportClassUsersFieldAliases,
};

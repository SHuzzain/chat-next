import { z } from "zod";

import { courseCentreRefSchema } from "@/features/centres/schema";
import { mongoIdSchema, ISODateSchema, lmsEmailSchema } from "@/lib/zod/primitives";
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

const centreRefSchema = courseCentreRefSchema;

const reportStatusSchema = z.enum(["ACTIVE", "INACTIVE"]);

const reportClassUserStatusSchema = z.enum([
  "ACTIVE",
  "INACTIVE",
  "DELETED",
  "COMPLETED",
  "IN_PROGRESS",
]);

/** Agent path → LMS path. Response names are the reverse of this map. */
export const enrollFields = new FieldAlias({
  centre: "courseCentre",
  "centre.name": "courseCentre.name",
  "centre._id": "courseCentre._id",
  "centre.code": "courseCentre.code",
  enrolledClassesCount: "assignedCourses",
  completedClassesCount: "completedCourses",
  userRoleTypes: "type",
  userStatus: "status",
});

export const reportUserEnrollRowSchema = z.looseObject({
  enrolledClassesCount: z
    .number()
    .optional()
    .describe("Enrolled count — Class enrolments assigned to the user"),
  completedClassesCount: z
    .number()
    .optional()
    .describe("Completed count — Class enrolments completed by the user"),
  createdAt: ISODateSchema.optional().describe("User registration date"),
  _id: mongoIdSchema
    .describe("User id")
    .meta({ ui: { role: "value" } }),
  email: lmsEmailSchema
    .describe("User email")
    .meta({ ui: { role: "detail" } }),
  fullName: z
    .string()
    .optional()
    .describe("User full name")
    .meta({ ui: { roles: ["label", "search"] } }),
  status: reportStatusSchema.optional(),
  type: z
    .array(
      z.looseObject({
        _id: mongoIdSchema.optional(),
        name: z.string().optional(),
      }),
    )
    .optional()
    .describe("User role types"),
  courseCentre: z
    .array(centreRefSchema)
    .optional()
    .describe("Centres assigned to the user"),
});

const reportUserEnrollQuerySchema = withAllowedSort(
  paginationQuerySchema.extend({
    centreId: mongoIdSchema.describe(CENTRE_ID_DESCRIBE).optional(),
  }),
  reportUserEnrollRowSchema,
);

/** LMS wire row for POST /reports/users. */
export const reportUserEnrollWireRowSchema = z.looseObject({
  assignedCourses: z.number().optional(),
  completedCourses: z.number().optional(),
  createdAt: ISODateSchema.optional(),
  _id: mongoIdSchema,
  email: lmsEmailSchema,
  fullName: z.string().optional(),
  status: reportStatusSchema.optional(),
  type: z
    .array(
      z.looseObject({
        _id: mongoIdSchema.optional(),
        name: z.string().optional(),
      }),
    )
    .optional(),
  courseCentre: z.array(centreRefSchema).optional(),
});

export const reportUserEnrollSchema = {
  query: reportUserEnrollQuerySchema,
  body: lmsListBodySchema(reportUserEnrollRowSchema),
  output: lmsPageSchema(reportUserEnrollRowSchema),
};

export const reportUserClassScoreRowSchema = z.looseObject({
  _id: mongoIdSchema
    .optional()
    .describe("Class enrollment record ID")
    .meta({ ui: { role: "value" } }),
  progress: z
    .number()
    .min(0)
    .max(100)
    .optional()
    .describe("Progress %")
    .meta({ ui: { role: "column" } }),
  score: z
    .number()
    .min(0)
    .max(100)
    .optional()
    .describe("Score %")
    .meta({ ui: { role: "column" } }),
  userRole: z.string().optional().describe("Learner's role in the LMS"),
  enrolledDate: ISODateSchema.optional().describe(
    "Date the learner enrolled in the Class",
  ),
  completionDate: ISODateSchema.nullable()
    .optional()
    .describe(
      "Date the learner completed the Class, or null if no completion date is recorded",
    ),
  status: reportClassUserStatusSchema
    .optional()
    .describe("Status")
    .meta({ ui: { role: "column" } }),
  centre: z
    .array(centreRefSchema)
    .optional()
    .describe("Centres for this Class enrollment"),
  // Known learner → each row is a Class, not a person.
  class: z
    .looseObject({
      _id: mongoIdSchema.optional(),
      name: z
        .string()
        .optional()
        .meta({ ui: { roles: ["label", "search"] } }),
      code: z
        .string()
        .optional()
        .meta({ ui: { role: "detail" } }),
    })
    .optional()
    .describe("Class for this enrollment"),
  user: z
    .looseObject({
      _id: mongoIdSchema.optional(),
      fullName: z.string().optional(),
      status: reportStatusSchema.optional(),
      centre: z
        .array(centreRefSchema)
        .optional()
        .describe("Centres assigned to the learner"),
    })
    .optional()
    .describe("Learner for this enrollment"),
});

export const reportUserClassScoreWireRowSchema = z.looseObject({
  _id: mongoIdSchema.optional(),
  progress: z.number().min(0).max(100).optional(),
  score: z.number().min(0).max(100).optional(),
  userRole: z.string().optional(),
  enrolledDate: ISODateSchema.optional(),
  completionDate: ISODateSchema.nullable().optional(),
  status: reportClassUserStatusSchema.optional(),
  courseCentre: z.array(centreRefSchema).optional(),
  course: z
    .looseObject({
      _id: mongoIdSchema.optional(),
      name: z.string().optional(),
      code: z.string().optional(),
    })
    .optional(),
  user: z
    .looseObject({
      _id: mongoIdSchema.optional(),
      fullName: z.string().optional(),
      status: reportStatusSchema.optional(),
      courseCentre: z.array(centreRefSchema).optional(),
    })
    .optional(),
});

/** On this endpoint `course` means Class (not parent Course). */
export const classScoreFields = new FieldAlias({
  class: "course",
  "class.name": "course.name",
  "class.code": "course.code",
  "class._id": "course._id",
  centre: "courseCentre",
  "centre.name": "courseCentre.name",
  "centre._id": "courseCentre._id",
  "centre.code": "courseCentre.code",
  "user.centre": "user.courseCentre",
});

const reportUserClassScoreQuerySchema = withAllowedSort(
  paginationQuerySchema.extend({
    userId: mongoIdSchema.describe("Learner id (required for this report)"),
    classId: mongoIdSchema.describe(CLASS_ID_DESCRIBE).optional(),
    centreId: mongoIdSchema.describe(CENTRE_ID_DESCRIBE).optional(),
  }),
  reportUserClassScoreRowSchema,
);

export const reportUserClassScoreSchema = {
  query: reportUserClassScoreQuerySchema,
  body: lmsListBodySchema(reportUserClassScoreRowSchema),
  output: lmsPageSchema(reportUserClassScoreRowSchema),
};

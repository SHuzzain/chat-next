import { z } from "zod";

import { courseCentreRefSchema } from "@/features/centres/schema";
import { mongoIdSchema, ISODateSchema } from "@/lib/zod/primitives";
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

const centreRefSchema = courseCentreRefSchema;

const reportStatusSchema = z.enum(["ACTIVE", "INACTIVE"]);

const reportClassUserStatusSchema = z.enum([
  "ACTIVE",
  "INACTIVE",
  "DELETED",
  "COMPLETED",
  "IN_PROGRESS",
]);

const fieldRotate = {
  input: {
    centre: "courseCentre",
    assignedCourses: "enrolledClassesCount",
    completedCourses: "completedClassesCount",
    userRoleTypes: "type",
    userStatus: "status",
  },
  output: {
    courseCentre: "centre",
    enrolledClassesCount: "assignedCourses",
    completedClassesCount: "completedCourses",
    type: "userRoleTypes",
    status: "userStatus",
  },
};

const fieldAliases = {
  centre: "courseCentre",
  "centre.name": "courseCentre.name",
  "centre._id": "courseCentre._id",
  "centre.code": "courseCentre.code",
  assignedCourses: "enrolledClassesCount",
  completedCourses: "completedClassesCount",
  userRoleTypes: "type",
  userStatus: "status",
};

const reportUserEnrollApiRowSchema = z.looseObject({
  assignedCourses: z
    .number()
    .optional()
    .describe("Enrolled count — Class enrolments assigned to the user"),
  completedCourses: z
    .number()
    .optional()
    .describe("Completed count — Class enrolments completed by the user"),
  createdAt: ISODateSchema.optional().describe("User registration date"),
  _id: mongoIdSchema.describe("User id"),
  email: z.email().optional().describe("User email"),
  fullName: z.string().optional().describe("User full name"),
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
    .describe("Centres (branch/company) assigned to the user"),
});

const reportUserEnrollInputRowSchema = reportUserEnrollApiRowSchema.transform(
  (data) => {
    const aliases = Object.entries(fieldRotate.input);

    return aliases.reduce(
      (acc, [key, value]) => {
        if (Object.hasOwn(data, key)) {
          acc[value] = data[key];
          delete acc[key];
        }

        return acc;
      },
      { ...data },
    );
  },
);

const reportUserEnrollOutputRowSchema =
  reportUserEnrollInputRowSchema.transform((data) => {
    const aliases = Object.entries(fieldRotate.output);

    return aliases.reduce(
      (acc, [key, value]) => {
        if (Object.hasOwn(data, key)) {
          acc[value] = data[key];
          delete acc[key];
        }

        return acc;
      },
      { ...data },
    );
  });

const reportUserEnrollQuerySchema = withAllowedSort(
  paginationQuerySchema.extend({
    centreId: mongoIdSchema.describe("Centre id (branch/company)").optional(),
  }),
  reportUserEnrollInputRowSchema,
).transform(({ centreId, ...rest }) => {
  return {
    ...rest,
    ...(centreId ? { courseCentre: centreId } : {}),
  };
});

export const reportUserEnrollSchema = {
  query: reportUserEnrollQuerySchema,
  body: lmsListBodySchema(reportUserEnrollInputRowSchema),
  output: reportUserEnrollOutputRowSchema,
  raw: reportUserEnrollApiRowSchema,
  fieldAliases: fieldAliases,
};

const reportUserClassScoreAgentRowSchema = z.looseObject({
  _id: mongoIdSchema.optional().describe("Class enrollment record ID"),
  progress: z
    .number()
    .min(0)
    .max(100)
    .optional()
    .describe("Learner's progress percentage in the Class, from 0 to 100"),
  score: z
    .number()
    .min(0)
    .max(100)
    .optional()
    .describe("Learner's score percentage for the Class, from 0 to 100"),
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
    .describe("Learner's enrollment or participation status for the Class"),
  centre: z
    .array(centreRefSchema)
    .optional()
    .describe(
      "Centres (branch/company) for this Class enrollment. Never Class. Prefer query.centreId.",
    ),
  class: z
    .looseObject({
      _id: mongoIdSchema.optional(),
      name: z.string().optional(),
      code: z.string().optional(),
    })
    .optional()
    .describe(
      "Class information for this enrollment. Prefer query.classId to filter by Class id.",
    ),
  user: z
    .looseObject({
      _id: mongoIdSchema.optional(),
      fullName: z.string().optional(),
      status: reportStatusSchema.optional(),
      centre: z
        .array(centreRefSchema)
        .optional()
        .describe("Centres assigned to the learner (not Classes)"),
    })
    .optional()
    .describe(
      "Learner details, including their name, account status, and associated Centres",
    ),
});

const reportUserClassScoreWireRowSchema = z.looseObject({
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
const reportUserClassScoreFieldAliases: FieldAliases = {
  class: "course",
  "class.name": "course.name",
  "class.code": "course.code",
  "class._id": "course._id",
  centre: "courseCentre",
  "centre.name": "courseCentre.name",
  "centre._id": "courseCentre._id",
  "centre.code": "courseCentre.code",
  "user.centre": "user.courseCentre",
};

const reportUserClassScoreQuerySchema = withAllowedSort(
  paginationQuerySchema.extend({
    userId: mongoIdSchema.describe("Learner id (required for this report)"),
    classId: mongoIdSchema.describe(CLASS_ID_DESCRIBE).optional(),
    centreId: mongoIdSchema.describe(CENTRE_ID_DESCRIBE).optional(),
  }),
  reportUserClassScoreAgentRowSchema,
);

export const reportUserClassScoreSchema = {
  query: reportUserClassScoreQuerySchema,
  body: lmsListBodySchema(reportUserClassScoreAgentRowSchema),
  output: lmsPageSchema(reportUserClassScoreAgentRowSchema),
  wireOutput: lmsPageSchema(reportUserClassScoreWireRowSchema),
  fieldAliases: reportUserClassScoreFieldAliases,
};

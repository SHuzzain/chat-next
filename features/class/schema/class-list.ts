import { z } from "zod";

import { courseCentreRefSchema } from "@/features/centres/schema/centre-list";
import { ISODateSchema, mongoIdSchema } from "@/lib/zod/primitives";
import { lmsListBodySchema } from "@/lib/tools/api-request";
import { paginatedQuerySchema } from "@/lib/tools/api-pagination";
import { lmsPageSchema } from "@/lib/tools/api-response";
import {
  CENTRE_ID_DESCRIBE,
  FieldAlias,
  PARENT_COURSE_ID_DESCRIBE,
  centreAlias,
} from "@/lib/tools/api-wire";

import { classSchema, classStatusSchema } from "./main-schema";

const mediaRootSchema = z.looseObject({
  root: z.string().optional(),
});

const namedRefSchema = z.looseObject({
  _id: mongoIdSchema.optional(),
  name: z.string().optional(),
});

const dateRangeSchema = z.looseObject({
  begin: ISODateSchema.optional(),
  end: ISODateSchema.optional(),
});

const centreRefSchema = courseCentreRefSchema;

/** Agent path → LMS path for POST /intakes. */
export const classListFields = new FieldAlias({
  ...centreAlias,
});

const classRowBase = {
  time: dateRangeSchema.nullish().describe("Class start and end dates"),
  category: namedRefSchema.nullish().describe("Class category"),
  teachingLanguage: z
    .looseObject({
      _id: mongoIdSchema.optional(),
      name: z.string().optional(),
      value: z.string().optional(),
    })
    .nullish(),
  creator: z
    .looseObject({
      _id: mongoIdSchema.optional(),
      fullName: z.string().optional(),
      avatar: mediaRootSchema.optional(),
    })
    .nullish(),
  parent: z
    .looseObject({
      _id: mongoIdSchema.optional(),
      name: z.string().optional(),
      thumbnail: mediaRootSchema.optional(),
    })
    .nullish()
    .describe("Parent Course this Class belongs to"),
  thumbnail: mediaRootSchema.nullish(),
  publishDate: ISODateSchema.optional(),
  rulesAndPath: mongoIdSchema.optional(),
  createdAt: ISODateSchema.optional(),
  updatedAt: ISODateSchema.optional(),
  name: z.string().meta({ ui: { roles: ["label", "search"] } }),
  code: z
    .string()
    .optional()
    .meta({ ui: { role: "detail" } }),
  _id: mongoIdSchema.meta({ ui: { role: "value" } }),
};

/** Agent-facing row from `POST /intakes` (populated lookups). */
export const classRowSchema = classSchema
  .pick({
    _id: true,
    name: true,
    code: true,
    status: true,
    totalIntakeTime: true,
    totalHours: true,
    totalEnrolledUsers: true,
    totalPrice: true,
    dashboardDisplay: true,
    isPinned: true,
    attendancePercentage: true,
  })
  .extend({
    ...classRowBase,
    centre: z
      .array(centreRefSchema)
      .optional()
      .describe("Centres associated with the Class"),
  })
  .describe("Class");

/** LMS wire row for POST /intakes. */
export const classWireRowSchema = classSchema
  .pick({
    _id: true,
    name: true,
    code: true,
    status: true,
    totalIntakeTime: true,
    totalHours: true,
    totalEnrolledUsers: true,
    totalPrice: true,
    dashboardDisplay: true,
    isPinned: true,
    attendancePercentage: true,
    courseCentre: true,
  })
  .extend({
    ...classRowBase,
    courseCentre: z.array(centreRefSchema).optional(),
  });

/** Minimal Class ref for other features. */
export const classRefSchema = classRowSchema.pick({
  _id: true,
  name: true,
  code: true,
});

const classListQuerySchema = paginatedQuerySchema(
  classRowSchema,
  z.object({
    status: classStatusSchema.optional(),
    parentCourseId: mongoIdSchema
      .optional()
      .describe(PARENT_COURSE_ID_DESCRIBE),
    centreId: mongoIdSchema.optional().describe(CENTRE_ID_DESCRIBE),
  }),
);

export const classListSchema = {
  query: classListQuerySchema,
  body: lmsListBodySchema(classRowSchema),
  output: lmsPageSchema(classRowSchema),
  /** intakes API uses `course` for parent Course id. */
  idMap: { parentCourseId: "course" as const },
};

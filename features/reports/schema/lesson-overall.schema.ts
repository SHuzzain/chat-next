import { courseCentreRefSchema } from "@/features/centres/schema";
import {
  ISODateSchema,
  lmsListBodySchema,
  lmsPageSchema,
  mongoIdSchema,
} from "@/lib/common-zod";
import {
  paginationQuerySchema,
  withAllowedSort,
} from "@/lib/tools/api-pagination";
import { CLASS_ID_DESCRIBE } from "@/lib/tools/api-wire";
import z from "zod";

const centreRefSchema = courseCentreRefSchema;

const unittypeSchema = z.enum([
  "VIDEO",
  "AUDIO",
  "FILES",
  "DOCUMENT",
  "SCORM",
  "CONTENT",
  "IFRAME",
  "TEST",
  "ASSIGNMENT",
  "SURVEY",
  "LIVESTREAMING",
  "CLASSROOM",
]);

const ReportlessonOverallRowSchema = z.object({
  centre: z
    .array(centreRefSchema.optional())
    .optional()
    .describe("Centre or Centres associated with the learner's Class"),

  class: z
    .string()
    .optional()
    .describe("Name of the Class associated with the lesson activity"),

  startDate: z
    .union([ISODateSchema, z.null()])
    .optional()
    .describe(
      "Date and time when the learner started the lesson, if provided by the API",
    ),

  endDate: z
    .union([ISODateSchema, z.null()])
    .optional()
    .describe(
      "Date and time when the learner ended the lesson, if provided by the API",
    ),

  totalDuration: z
    .number()
    .optional()
    .describe(
      "Total time the learner spent on the lesson, in the unit returned by the API",
    ),

  unit: z
    .string()
    .optional()
    .describe(
      "Lesson name; the LMS API uses the field name 'unit' for a lesson",
    ),

  unittype: unittypeSchema
    .optional()
    .describe(
      "Type of lesson content, such as Video, Document, Test, or Assignment",
    ),

  user: z
    .string()
    .optional()
    .describe("Name of the learner associated with the lesson activity"),

  _id: mongoIdSchema
    .optional()
    .describe("User ID associated with this lesson report record"),
});

const ReportlessonOverallQuerySchema = withAllowedSort(
  paginationQuerySchema.extend({
    classId: mongoIdSchema.describe(
      `${CLASS_ID_DESCRIBE} Required for this report.`,
    ),
  }),
  ReportlessonOverallRowSchema,
);

const ReportLessonOverallBodySchema = lmsListBodySchema(
  ReportlessonOverallRowSchema,
);

export const reportLessonOverallSchema = {
  output: lmsPageSchema(ReportlessonOverallRowSchema),
  query: ReportlessonOverallQuerySchema,
  body: ReportLessonOverallBodySchema,
};

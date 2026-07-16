// AUTO-GENERATED from Mongoose model "CourseUnit" — do not edit by hand
// Run: npm run generate:mcp-schemas -- --models CourseUnit
import { z } from "zod";
import { dateSchema, objectIdSchema } from "./shared";

const sourceOrginSchema = z.enum(["ELMSS"]);
const statusSchema = z.enum(["ACTIVE", "INACTIVE", "IN_PROGRESS", "COMPLETED", "DELETED", "GROUP_DELETED", "COURSEDELETED"]);

export const courseUnitSchema = z.object({
  _id: objectIdSchema.optional(),
  clone: objectIdSchema.optional(),
  course: objectIdSchema.optional(),
  createdAt: dateSchema.optional(),
  creator: objectIdSchema,
  description: z.string().optional(),
  group: objectIdSchema.optional(),
  intake: objectIdSchema.optional(),
  name: z.string(),
  order: z.number(),
  price: z.number().optional(),
  sourceOrgin: sourceOrginSchema.optional(),
  status: statusSchema.optional(),
  time: z.object({
    begin: dateSchema.optional(),
    end: dateSchema.optional(),
  }).optional(),
  type: z.string().optional(),
  updatedAt: dateSchema.optional(),
  __v: z.number().optional(),
});

export type CourseUnit = z.infer<typeof courseUnitSchema>;

// AUTO-GENERATED from Mongoose model "CourseGroup" — do not edit by hand
// Run: npm run generate:mcp-schemas -- --models CourseGroup
import { z } from "zod";
import { dateSchema, objectIdSchema } from "@/mcptools/shared";

const sourceOrginSchema = z.enum(["ELMSS"]);
const statusSchema = z.enum(["ACTIVE", "INACTIVE", "DELETED", "COURSEDELETED"]);

export const courseGroupSchema = z.object({
  _id: objectIdSchema.optional(),
  course: z.array(objectIdSchema).optional(),
  courseCentre: z.array(objectIdSchema).optional(),
  createdAt: dateSchema.optional(),
  creator: objectIdSchema.optional(),
  description: z.string().optional(),
  key: z.string().optional(),
  name: z.string(),
  sourceOrgin: sourceOrginSchema.optional(),
  status: statusSchema.optional(),
  updatedAt: dateSchema.optional(),
  __v: z.number().optional(),
});

export type CourseGroup = z.infer<typeof courseGroupSchema>;

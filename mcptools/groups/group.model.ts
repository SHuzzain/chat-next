// AUTO-GENERATED from Mongoose model "Group" — do not edit by hand
// Run: npm run generate:mcp-schemas -- --models Group
import { z } from "zod";
import { dateSchema, objectIdSchema } from "@/mcptools/shared";

const sourceOrginSchema = z.enum(["ELMSS"]);
const statusSchema = z.enum(["ACTIVE", "INACTIVE", "DELETED", "COURSEDELETED"]);

export const groupSchema = z.object({
  _id: objectIdSchema.optional(),
  clone: objectIdSchema.optional(),
  CombineCourse: z.array(objectIdSchema).optional(),
  course: objectIdSchema.optional(),
  createdAt: dateSchema.optional(),
  creator: objectIdSchema,
  description: z.string().optional(),
  intake: objectIdSchema.optional(),
  key: z.string(),
  name: z.string(),
  order: z.number(),
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

export type Group = z.infer<typeof groupSchema>;

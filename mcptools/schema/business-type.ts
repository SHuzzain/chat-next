// AUTO-GENERATED from Mongoose model "BusinessType" — do not edit by hand
// Run: npm run generate:mcp-schemas -- --models BusinessType
import { z } from "zod";
import { dateSchema, objectIdSchema } from "./shared";

const sourceOrginSchema = z.enum(["ELMSS"]);
const statusSchema = z.enum(["ACTIVE", "INACTIVE", "DELETED"]);

export const businessTypeSchema = z.object({
  _id: objectIdSchema.optional(),
  code: z.string().optional(),
  createdAt: dateSchema.optional(),
  creator: objectIdSchema,
  description: z.string(),
  name: z.string(),
  sourceOrgin: sourceOrginSchema.optional(),
  status: statusSchema.optional(),
  updatedAt: dateSchema.optional(),
  __v: z.number().optional(),
});

export type BusinessType = z.infer<typeof businessTypeSchema>;

// AUTO-GENERATED from Mongoose model "Organisation" — do not edit by hand
// Run: npm run generate:mcp-schemas -- --models Organisation
import { z } from "zod";
import { dateSchema, objectIdSchema } from "@/mcptools/shared";

const sourceOrginSchema = z.enum(["ELMSS"]);
const statusSchema = z.enum(["ACTIVE", "INACTIVE", "DELETED"]);

export const organisationSchema = z.object({
  _id: objectIdSchema.optional(),
  address: z.string().optional(),
  code: z.string(),
  createdAt: dateSchema.optional(),
  creator: objectIdSchema,
  description: z.string(),
  name: z.string(),
  sourceOrgin: sourceOrginSchema.optional(),
  status: statusSchema.optional(),
  updatedAt: dateSchema.optional(),
  website: z.string().optional(),
  __v: z.number().optional(),
});

export type Organisation = z.infer<typeof organisationSchema>;

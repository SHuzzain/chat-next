// AUTO-GENERATED from Mongoose model "BadgeType" — do not edit by hand
// Run: npm run generate:mcp-schemas -- --models BadgeType
import { z } from "zod";
import { dateSchema, objectIdSchema } from "@/mcptools/shared";

export const badgeTypeSchema = z.object({
  _id: objectIdSchema.optional(),
  createdAt: dateSchema.optional(),
  creator: objectIdSchema,
  name: z.string(),
  rule: z.unknown().optional(),
  status: z.string().optional(),
  type: z.unknown().optional(),
  updatedAt: dateSchema.optional(),
  __v: z.number().optional(),
});

export type BadgeType = z.infer<typeof badgeTypeSchema>;

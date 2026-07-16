// AUTO-GENERATED from Mongoose model "Badge" — do not edit by hand
// Run: npm run generate:mcp-schemas -- --models Badge
import { z } from "zod";
import { dateSchema, objectIdSchema, statusSchema } from "./shared";

export const badgeSchema = z.object({
  _id: objectIdSchema.optional(),
  allowDuplicateBadge: z.boolean().optional().default(false),
  badgeType: objectIdSchema,
  begin: dateSchema.optional(),
  completionType: z.string().optional(),
  courseCentre: z.array(objectIdSchema).optional(),
  createdAt: dateSchema.optional(),
  creator: objectIdSchema,
  description: z.string(),
  displayBefore: z.boolean().optional(),
  expiry: dateSchema.optional(),
  hoverText: z.string().optional(),
  maximum: z.boolean().optional().default(false),
  maximumCount: z.number().optional(),
  requirementArray: z.array(z.unknown()).optional(),
  status: statusSchema,
  thumbnail: z.string().optional(),
  timezone: z.string().optional(),
  title: z.string(),
  updatedAt: dateSchema.optional(),
  __v: z.number().optional(),
});

export type Badge = z.infer<typeof badgeSchema>;

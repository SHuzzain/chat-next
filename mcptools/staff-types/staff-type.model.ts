// AUTO-GENERATED from Mongoose model "StaffType" — do not edit by hand
// Run: npm run generate:mcp-schemas -- --models StaffType
import { z } from "zod";
import { dateSchema, objectIdSchema } from "@/mcptools/shared";

const statusSchema = z.enum(["ACTIVE", "INACTIVE", "DELETED"]);

export const staffTypeSchema = z.object({
  _id: objectIdSchema.optional(),
  businessType: objectIdSchema.optional(),
  createdAt: dateSchema.optional(),
  description: z.string().optional(),
  setting: z.object({
    offboarding: z.unknown().optional(),
    onboarding: z.unknown().optional(),
    transferStaff: z.unknown().optional(),
  }).optional(),
  staffType: z.string(),
  status: statusSchema.optional(),
  synsStatus: z.string().optional(),
  updatedAt: dateSchema.optional(),
  __v: z.number().optional(),
});

export type StaffType = z.infer<typeof staffTypeSchema>;

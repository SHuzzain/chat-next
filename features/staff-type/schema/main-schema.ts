import { z } from "zod";

import { mongoIdSchema, populatedRefSchema } from "@/lib/zod/primitives";

export const staffTypeStatusSchema = z.enum([
  "ACTIVE",
  "INACTIVE",
  "DELETED",
]);

export const staffTypeSchema = z.looseObject({
  _id: mongoIdSchema,
  staffType: z.string(),
  description: z.string().optional(),
  businessType: populatedRefSchema.optional(),
  status: staffTypeStatusSchema.optional(),
  synsStatus: z.string().optional(),
  setting: z
    .object({
      onboarding: z.record(z.string(), z.unknown()).optional(),
      transferStaff: z.record(z.string(), z.unknown()).optional(),
      offboarding: z.record(z.string(), z.unknown()).optional(),
    })
    .optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export type StaffTypeStatus = z.infer<typeof staffTypeStatusSchema>;
export type StaffType = z.infer<typeof staffTypeSchema>;

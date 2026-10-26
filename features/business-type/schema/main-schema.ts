import { z } from "zod";

import { sourceOrginSchema } from "@/features/organisation/schema";
import { mongoIdSchema, populatedRefSchema } from "@/lib/zod/primitives";

export const businessTypeStatusSchema = z.enum([
  "ACTIVE",
  "INACTIVE",
  "DELETED",
]);

export const businessTypeSchema = z.looseObject({
  _id: mongoIdSchema,
  creator: populatedRefSchema,
  name: z.string(),
  code: z.string().optional(),
  description: z.string(),
  status: businessTypeStatusSchema.optional(),
  sourceOrgin: sourceOrginSchema.optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export type BusinessTypeStatus = z.infer<typeof businessTypeStatusSchema>;
export type BusinessType = z.infer<typeof businessTypeSchema>;

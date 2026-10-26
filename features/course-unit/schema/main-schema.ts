import { z } from "zod";

import { sourceOrginSchema } from "@/features/organisation/schema";
import { mongoIdSchema, populatedRefSchema } from "@/lib/zod/primitives";

export const courseUnitStatusSchema = z.enum([
  "ACTIVE",
  "INACTIVE",
  "IN_PROGRESS",
  "COMPLETED",
  "DELETED",
  "GROUP_DELETED",
  "COURSEDELETED",
]);

export const courseUnitSchema = z.looseObject({
  _id: mongoIdSchema,
  creator: populatedRefSchema,
  type: z.string().optional(),
  name: z.string(),
  description: z.string().optional(),
  price: z.number().optional(),
  course: populatedRefSchema.optional(),
  intake: populatedRefSchema.optional(),
  group: populatedRefSchema.optional(),
  clone: populatedRefSchema.optional(),
  time: z
    .object({
      begin: z.coerce.date().optional(),
      end: z.coerce.date().optional(),
    })
    .optional(),
  order: z.number(),
  status: courseUnitStatusSchema.optional(),
  sourceOrgin: sourceOrginSchema.optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export type CourseUnitStatus = z.infer<typeof courseUnitStatusSchema>;
export type CourseUnit = z.infer<typeof courseUnitSchema>;

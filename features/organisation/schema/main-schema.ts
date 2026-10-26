import { z } from "zod";

import { mongoIdSchema, populatedRefSchema } from "@/lib/zod/primitives";

export const organisationStatusSchema = z.enum([
  "ACTIVE",
  "INACTIVE",
  "DELETED",
]);

export const sourceOrginSchema = z.enum(["ELMSS"]);

export const organisationSchema = z.looseObject({
  _id: mongoIdSchema,
  creator: populatedRefSchema,
  name: z.string(),
  code: z.string(),
  description: z.string(),
  status: organisationStatusSchema.optional(),
  address: z.string().optional(),
  website: z.string().optional(),
  sourceOrgin: sourceOrginSchema.optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export type OrganisationStatus = z.infer<typeof organisationStatusSchema>;
export type Organisation = z.infer<typeof organisationSchema>;

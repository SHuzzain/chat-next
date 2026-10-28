import { z } from "zod";

import { userSchema } from "@/features/user/schema/main-schema";
import { ISODateSchema, mongoIdSchema } from "@/lib/zod/primitives";
import { lmsListBodySchema } from "@/lib/tools/api-request";
import { paginatedQuerySchema } from "@/lib/tools/api-pagination";
import { lmsPageSchema } from "@/lib/tools/api-response";

import { centreSchema, centreStatusSchema } from "./main-schema";

const namedRefSchema = z.looseObject({
  _id: mongoIdSchema.optional(),
  name: z.string().optional(),
});

const creatorRefSchema = userSchema.pick({
  _id: true,
  email: true,
  fullName: true,
});

const countryRefSchema = z.looseObject({
  _id: mongoIdSchema.optional(),
  name: z.string().optional(),
});

const stateRefSchema = z.looseObject({
  _id: mongoIdSchema.optional(),
  name: z.string().optional(),
});

const cityRefSchema = z.looseObject({
  _id: mongoIdSchema.optional(),
  name: z.string().optional(),
  stateCode: z.number().optional(),
});

/** Row shape from `POST course-centres/advance-filter` (populated lookups). */
export const courseCentreRowSchema = centreSchema
  .extend({
    creator: creatorRefSchema.optional(),
    organisation: namedRefSchema.optional(),
    businessType: namedRefSchema.optional(),
    centreType: namedRefSchema.optional(),
    country: countryRefSchema.optional(),
    state: stateRefSchema.optional(),
    city: cityRefSchema.optional(),
    registeredNumber: z.string().nullable().optional(),
    createdAt: ISODateSchema.optional(),
    updatedAt: ISODateSchema.optional(),
  })
  .describe("Centre");

/** Minimal centre ref for reports and user payloads. */
export const courseCentreRefSchema = courseCentreRowSchema.pick({
  _id: true,
  name: true,
  code: true,
});

/** @deprecated Prefer {@link courseCentreRowSchema} */
export const courseCentreSchema = courseCentreRowSchema;

const courseCentreListQuerySchema = paginatedQuerySchema(
  courseCentreRowSchema,
);

export const courseCentreListSchema = {
  query: courseCentreListQuerySchema,
  body: lmsListBodySchema(courseCentreRowSchema),
  output: lmsPageSchema(courseCentreRowSchema),
};

export const centreIdParamSchema = z.object({
  id: mongoIdSchema.optional(),
});

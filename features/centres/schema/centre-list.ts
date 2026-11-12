import { z } from "zod";

import { userSchema } from "@/features/user/schema/main-schema";
import { ISODateSchema, mongoIdSchema } from "@/lib/zod/primitives";
import { lmsListBodySchema } from "@/lib/tools/api-request";
import { paginatedQuerySchema } from "@/lib/tools/api-pagination";
import { lmsPageSchema } from "@/lib/tools/api-response";
import { FieldAlias } from "@/lib/tools/api-wire";

import { centreSchema } from "./main-schema";

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

/**
 * Agent path → LMS path for POST course-centres/advance-filter.
 * Row fields already match wire (this resource is the Centre itself).
 */
export const centreListFields = new FieldAlias({
  credit: "points",
});

/** Agent-facing row from `POST course-centres/advance-filter`. */
export const centreRowSchema = centreSchema
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

/** LMS wire row — same keys as agent for this endpoint. */
export const centreWireRowSchema = centreRowSchema;

/** Minimal centre ref for reports and user payloads. */
export const centreRefSchema = centreRowSchema.pick({
  _id: true,
  name: true,
  code: true,
});

/** @deprecated Prefer {@link centreRowSchema} */
export const courseCentreRowSchema = centreRowSchema;

/** @deprecated Prefer {@link centreRefSchema} */
export const courseCentreRefSchema = centreRefSchema;

/** @deprecated Prefer {@link centreRowSchema} */
export const courseCentreSchema = centreRowSchema;

const centreListQuerySchema = paginatedQuerySchema(centreRowSchema);

export const centreListSchema = {
  query: centreListQuerySchema,
  body: lmsListBodySchema(centreRowSchema),
  output: lmsPageSchema(centreRowSchema),
};

/** @deprecated Prefer {@link centreListSchema} */
export const courseCentreListSchema = centreListSchema;

export const centreIdParamSchema = z.object({
  id: mongoIdSchema.optional(),
});

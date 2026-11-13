import { z } from "zod";

import { ISODateSchema, mongoIdSchema } from "@/lib/zod/primitives";
import { lmsListBodySchema } from "@/lib/tools/api-request";
import { paginatedQuerySchema } from "@/lib/tools/api-pagination";
import { lmsPageSchema } from "@/lib/tools/api-response";
import {
  CENTRE_ID_DESCRIBE,
  FieldAlias,
} from "@/lib/tools/api-wire";

import { staffTypeSchema, staffTypeStatusSchema } from "./main-schema";

const businessTypeRefSchema = z.looseObject({
  _id: mongoIdSchema.optional(),
  name: z.string().optional(),
});

/**
 * Agent path → LMS path for POST staff-type/get-staff-types.
 * Query id renames (centreId → courseCentre) use FieldAlias.toWireRequest defaults.
 * businessTypeId / currentStaffTypeId are renamed in the API layer.
 */
export const staffTypeListFields = new FieldAlias({});

/** Agent-facing row from `POST staff-type/get-staff-types`. */
export const staffTypeListRowSchema = staffTypeSchema
  .extend({
    businessType: businessTypeRefSchema.optional(),
    status: staffTypeStatusSchema.optional(),
    createdAt: ISODateSchema.optional(),
    updatedAt: ISODateSchema.optional(),
  })
  .describe("Staff type");

/** LMS wire row — same keys as agent for this endpoint. */
export const staffTypeWireRowSchema = staffTypeListRowSchema;

const staffTypeListQuerySchema = paginatedQuerySchema(
  staffTypeListRowSchema,
).extend({
  textSearch: z
    .string()
    .optional()
    .describe("Search staff type name (case-insensitive contains)"),
  centreId: mongoIdSchema.optional().describe(CENTRE_ID_DESCRIBE),
  businessTypeId: mongoIdSchema
    .optional()
    .describe("Business type id to filter staff types"),
  currentStaffTypeId: mongoIdSchema
    .optional()
    .describe(
      "Exclude this staff type id from results (e.g. when changing type)",
    ),
});

export const staffTypeListBodySchema = lmsListBodySchema(
  staffTypeListRowSchema,
).extend({
  businessTypeIds: z
    .array(mongoIdSchema)
    .optional()
    .describe(
      "Filter staff types whose businessType is in this list (e.g. from selected centres)",
    ),
});

export const staffTypeListSchema = {
  query: staffTypeListQuerySchema,
  body: staffTypeListBodySchema,
  output: lmsPageSchema(staffTypeListRowSchema),
};

export type StaffTypeList = {
  query: z.infer<typeof staffTypeListSchema.query>;
  body: z.infer<typeof staffTypeListSchema.body>;
  output: z.infer<typeof staffTypeListSchema.output>;
};

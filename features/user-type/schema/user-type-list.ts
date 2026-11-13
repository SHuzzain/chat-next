import { z } from "zod";

import { lmsPageSchema } from "@/lib/tools/api-response";
import { mongoIdSchema } from "@/lib/zod/primitives";
import { userRoleSchema } from "@/lib/zod/role";

import { authenticationTypeSchema } from "./main-schema";

/**
 * Row from GET /user-types/list (Super Admin already excluded by LMS).
 * Fields match UserTypeService.getUserTypeList projection.
 */
export const userTypeListRowSchema = z
  .looseObject({
    _id: mongoIdSchema.meta({ ui: { role: "value" } }),
    name: z.string().meta({ ui: { roles: ["label", "search"] } }),
    key: z.string().optional().meta({ ui: { role: "detail" } }),
    defaultRole: userRoleSchema.optional(),
    systemRole: userRoleSchema.optional(),
    roles: z.array(userRoleSchema).optional(),
    authenticationType: z.array(authenticationTypeSchema).optional(),
  })
  .describe("User type");

/**
 * Query for GET /user-types/list.
 * Backend accepts only: firstId, lastId, rowPerPage (validator).
 * textSearch is read by the controller/service (name regex) though not in the
 * express-validator list — keep it for search.
 * No page / order / orderBy / advanceFilter — this is not an advance-filter API.
 */
export const userTypeListQuerySchema = z.object({
  rowPerPage: z.coerce
    .number()
    .int()
    .min(1)
    .max(100)
    .optional()
    .describe("Max rows to return (cursor page size)"),
  firstId: mongoIdSchema
    .optional()
    .describe("Cursor: return types with _id greater than this (newer page)"),
  lastId: mongoIdSchema
    .optional()
    .describe("Cursor: return types with _id less than this (older page)"),
  textSearch: z
    .string()
    .optional()
    .describe("Search user type name (case-insensitive contains)"),
});

/** GET has no body — keep an empty object so createPaginatedTool still type-checks. */
export const userTypeListBodySchema = z
  .object({})
  .describe(
    "Unused. GET /user-types/list has no request body and no advanceFilter.",
  );

export const userTypeListSchema = {
  query: userTypeListQuerySchema,
  body: userTypeListBodySchema,
  output: lmsPageSchema(userTypeListRowSchema),
};

export type UserTypeList = {
  query: z.infer<typeof userTypeListSchema.query>;
  body: z.infer<typeof userTypeListSchema.body>;
  output: z.infer<typeof userTypeListSchema.output>;
};

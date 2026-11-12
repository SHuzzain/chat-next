import { z } from "zod";

import { lmsPageSchema } from "@/lib/tools/api-response";
import { paginatedQuerySchema } from "@/lib/tools/api-pagination";
import { lmsListBodySchema } from "@/lib/tools/api-request";
import { mongoIdSchema } from "@/lib/zod/primitives";
import { userRoleSchema } from "@/lib/zod/role";

import { authenticationTypeSchema } from "./main-schema";

/** Row from GET /user-types/list (Super Admin already excluded by LMS). */
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

const userTypeListQuerySchema = paginatedQuerySchema(
  userTypeListRowSchema,
).extend({
  textSearch: z.string().optional(),
});

export const userTypeListSchema = {
  query: userTypeListQuerySchema,
  body: lmsListBodySchema(userTypeListRowSchema),
  output: lmsPageSchema(userTypeListRowSchema),
};

export type UserTypeList = {
  query: z.infer<typeof userTypeListSchema.query>;
  body: z.infer<typeof userTypeListSchema.body>;
  output: z.infer<typeof userTypeListSchema.output>;
};

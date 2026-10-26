import { z } from "zod";

import { courseCentreRefSchema } from "@/features/centres/schema/centre-list";
import { ISODateSchema, mongoIdSchema } from "@/lib/zod/primitives";
import { lmsListBodySchema } from "@/lib/tools/api-request";
import { paginatedQuerySchema } from "@/lib/tools/api-pagination";
import { lmsPageSchema } from "@/lib/tools/api-response";

import { CENTRE_ID_DESCRIBE } from "@/lib/tools/api-wire";

import { userSchema } from "./main-schema";

/** Row shape from `POST users/get-users` (populated centre lookups). */
export const userInfoRowSchema = userSchema
  .pick({
    _id: true,
    bio: true,
    email: true,
    fullName: true,
    lastLogin: true,
    online: true,
    unreadMessage: true,
    status: true,
    type: true,
    registrationBy: true,
    demeritPoints: true,
  })
  .extend({
    courseCentre: z
      .array(courseCentreRefSchema)
      .optional()
      .describe(
        "Centres (branch/company) assigned to the user. LMS field courseCentre means Centre, never Class. Prefer query.centreId to filter.",
      ),
    admissionNumber: z.string().optional().describe("Admission number; often mirrors the user id"),
    createdAt: ISODateSchema.optional(),
    updatedAt: ISODateSchema.optional(),
    fullName: z
      .string()
      .optional()
      .meta({ ui: { roles: ["label", "search"] } }),
    email: z
      .email()
      .max(150)
      .meta({ ui: { role: "detail" } }),
    _id: mongoIdSchema.meta({ ui: { role: "value" } }),
  })
  .describe("User from LMS users collection");

const userInfoListQuerySchema = paginatedQuerySchema(
  userInfoRowSchema,
  z.object({
    centreId: mongoIdSchema.optional().describe(CENTRE_ID_DESCRIBE),
    userType: mongoIdSchema.optional().describe("Filter by user type / role ids"),
  }),
);

export const userInfoListSchema = {
  query: userInfoListQuerySchema,
  body: lmsListBodySchema(userInfoRowSchema),
  output: lmsPageSchema(userInfoRowSchema),
};

import { z } from "zod";

import { courseCentreRefSchema } from "@/features/centres/schema/centre-list";
import {
  ISODateSchema,
  lmsEmailSchema,
  mongoIdSchema,
} from "@/lib/zod/primitives";
import { lmsListBodySchema } from "@/lib/tools/api-request";
import { paginatedQuerySchema } from "@/lib/tools/api-pagination";
import { lmsPageSchema } from "@/lib/tools/api-response";
import {
  CENTRE_ID_DESCRIBE,
  FieldAlias,
  centreAlias,
} from "@/lib/tools/api-wire";

import { userSchema } from "./main-schema";

const centreNameRefSchema = courseCentreRefSchema.pick({
  _id: true,
  name: true,
});

/** Agent path → LMS path for POST users/get-users. */
export const userInfoFields = new FieldAlias({
  ...centreAlias,
});

const userInfoRowBase = {
  admissionNumber: z
    .string()
    .optional()
    .describe("Admission number; often mirrors the user id"),
  createdAt: ISODateSchema.optional(),
  updatedAt: ISODateSchema.optional(),
  fullName: z
    .string()
    .optional()
    .meta({ ui: { roles: ["label", "search"] } }),
  email: lmsEmailSchema.meta({ ui: { role: "detail" } }),
  _id: mongoIdSchema.meta({ ui: { role: "value" } }),
};

/** Agent-facing row from `POST users/get-users`. */
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
    mobile: true,
  })
  .extend({
    ...userInfoRowBase,
    centre: z
      .array(centreNameRefSchema)
      .optional()
      .describe("Centres assigned to the user"),
  })
  .describe("User");

/** LMS wire row for POST users/get-users. */
export const userInfoWireRowSchema = userSchema
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
    mobile: true,
    courseCentre: true,
  })
  .extend({
    ...userInfoRowBase,
    courseCentre: z.array(centreNameRefSchema).optional(),
  });

const userInfoListQuerySchema = paginatedQuerySchema(
  userInfoRowSchema,
  z.object({
    centreId: mongoIdSchema.optional().describe(CENTRE_ID_DESCRIBE),
    userType: mongoIdSchema
      .optional()
      .describe("Filter by user type / role ids"),
  }),
);

export const userInfoListSchema = {
  query: userInfoListQuerySchema,
  body: lmsListBodySchema(userInfoRowSchema),
  output: lmsPageSchema(userInfoRowSchema),
};

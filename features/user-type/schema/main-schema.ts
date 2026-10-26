import { z } from "zod";

import { userRoleSchema } from "@/lib/zod/role";
import { mongoIdSchema, populatedRefSchema } from "@/lib/zod/primitives";

export const userTypeStatusSchema = z.enum(["ACTIVE", "DELETED"]);

export const authenticationTypeSchema = z.enum(["SSO", "2FA"]);

export const userTypeSchema = z.looseObject({
  _id: mongoIdSchema,
  name: z.string(),
  roles: z.array(userRoleSchema).optional(),
  key: z.string().optional(),
  defaultRole: userRoleSchema,
  systemRole: userRoleSchema.optional(),
  userTypeUnits: z.array(populatedRefSchema).optional(),
  status: userTypeStatusSchema.optional(),
  authenticationType: z.array(authenticationTypeSchema).optional(),
  applySyncToExistingUser: z.boolean().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export type UserTypeStatus = z.infer<typeof userTypeStatusSchema>;
export type AuthenticationType = z.infer<typeof authenticationTypeSchema>;
export type UserType = z.infer<typeof userTypeSchema>;

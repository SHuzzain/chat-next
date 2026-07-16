// AUTO-GENERATED from Mongoose model "UserType" — do not edit by hand
// Run: npm run generate:mcp-schemas -- --models UserType
import { z } from "zod";
import { dateSchema, objectIdSchema } from "./shared";

const authenticationTypeItemSchema = z.enum(["SSO", "2FA"]);
const defaultRoleSchema = z.enum(["SUPER_ADMIN", "ADMIN", "INSTRUCTOR", "LEARNER", "CENTRE_ADMIN", "CENTRE_BL", "HR", "FINANCE", "FRANCHISE_MANAGER"]);
const rolesItemSchema = z.enum(["SUPER_ADMIN", "ADMIN", "INSTRUCTOR", "LEARNER", "CENTRE_ADMIN", "CENTRE_BL", "HR", "FINANCE", "FRANCHISE_MANAGER"]);
const statusSchema = z.enum(["ACTIVE", "DELETED"]);
const systemRoleSchema = z.enum(["SUPER_ADMIN", "ADMIN", "INSTRUCTOR", "LEARNER", "CENTRE_ADMIN", "CENTRE_BL", "HR", "FINANCE", "FRANCHISE_MANAGER"]);

export const userTypeSchema = z.object({
  _id: objectIdSchema.optional(),
  applySyncToExistingUser: z.boolean().optional(),
  authenticationType: z.array(authenticationTypeItemSchema).optional(),
  createdAt: dateSchema.optional(),
  defaultRole: defaultRoleSchema,
  key: z.string().optional(),
  name: z.string(),
  roles: z.array(rolesItemSchema).optional(),
  status: statusSchema.optional(),
  systemRole: systemRoleSchema.optional(),
  updatedAt: dateSchema.optional(),
  userTypeUnits: z.array(objectIdSchema).optional(),
  __v: z.number().optional(),
});

export type UserType = z.infer<typeof userTypeSchema>;

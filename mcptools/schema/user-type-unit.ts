// AUTO-GENERATED from Mongoose model "UserTypeUnit" — do not edit by hand
// Run: npm run generate:mcp-schemas -- --models UserTypeUnit
import { z } from "zod";
import { dateSchema, objectIdSchema } from "./shared";

const roleSchema = z.enum(["SUPER_ADMIN", "ADMIN", "INSTRUCTOR", "LEARNER", "CENTRE_ADMIN", "CENTRE_BL", "HR", "FINANCE", "FRANCHISE_MANAGER"]);
const methodSchema = z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]);
const statusSchema = z.enum(["ACTIVE", "DELETED"]);

export const userTypeUnitSchema = z.object({
  _id: objectIdSchema.optional(),
  createdAt: dateSchema.optional(),
  dependencies: z.array(objectIdSchema).optional(),
  name: z.string(),
  parent: objectIdSchema.optional(),
  role: roleSchema.optional(),
  routes: z.array(z.object({
    "_id": objectIdSchema.optional(),
    "method": methodSchema.optional(),
    "role": roleSchema.optional(),
    "route": z.string().optional(),
  })).optional(),
  status: statusSchema.optional(),
  updatedAt: dateSchema.optional(),
  __v: z.number().optional(),
});

export type UserTypeUnit = z.infer<typeof userTypeUnitSchema>;

import { z } from "zod";

import { httpMethodSchema, userRoleSchema } from "@/lib/zod/role";
import { mongoIdSchema, populatedRefSchema } from "@/lib/zod/primitives";

export const userTypeUnitStatusSchema = z.enum(["ACTIVE", "DELETED"]);

export const userTypeUnitRouteSchema = z.looseObject({
  _id: mongoIdSchema.optional(),
  method: httpMethodSchema.optional(),
  role: userRoleSchema.optional(),
  route: z.string().optional(),
});

export const userTypeUnitSchema = z.looseObject({
  _id: mongoIdSchema,
  name: z.string(),
  role: userRoleSchema.optional(),
  routes: z.array(userTypeUnitRouteSchema).optional(),
  dependencies: z.array(populatedRefSchema).optional(),
  parent: populatedRefSchema.optional(),
  status: userTypeUnitStatusSchema.optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export type UserTypeUnitStatus = z.infer<typeof userTypeUnitStatusSchema>;
export type UserTypeUnitRoute = z.infer<typeof userTypeUnitRouteSchema>;
export type UserTypeUnit = z.infer<typeof userTypeUnitSchema>;

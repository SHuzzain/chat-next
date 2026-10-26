import { z } from "zod";

export const userRoleSchema = z.enum([
  "SUPER_ADMIN",
  "ADMIN",
  "INSTRUCTOR",
  "LEARNER",
  "CENTRE_ADMIN",
  "CENTRE_BL",
  "HR",
  "FINANCE",
  "FRANCHISE_MANAGER",
]);

export const httpMethodSchema = z.enum([
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
]);

export type UserRole = z.infer<typeof userRoleSchema>;
export type HttpMethod = z.infer<typeof httpMethodSchema>;

import type { LmsAuth } from "./auth";

const USER_REPORT_ROLES = new Set([
  "SUPER_ADMIN",
  "ADMIN",
  "INSTRUCTOR",
  "CENTRE_ADMIN",
  "CENTRE_BL",
  "HR",
]);

export function canViewUserReport(auth: LmsAuth): boolean {
  if (!auth.role) return true;
  return USER_REPORT_ROLES.has(auth.role);
}

export function canViewCourseCentres(auth: LmsAuth): boolean {
  if (!auth.role) return true;
  return USER_REPORT_ROLES.has(auth.role);
}

export function canViewUsers(auth: LmsAuth): boolean {
  if (!auth.role) return true;
  return USER_REPORT_ROLES.has(auth.role);
}

const USER_CREATE_ROLES = new Set([
  "SUPER_ADMIN",
  "ADMIN",
  "CENTRE_ADMIN",
]);

/** Advisory — LMS enforces create privileges and Super Admin block. */
export function canCreateUsers(auth: LmsAuth): boolean {
  if (!auth.role) return true;
  return USER_CREATE_ROLES.has(auth.role);
}

export function canViewClasses(auth: LmsAuth): boolean {
  if (!auth.role) return true;
  return USER_REPORT_ROLES.has(auth.role);
}

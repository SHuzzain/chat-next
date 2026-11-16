/**
 * LMS scopes centres to auth.user.courseCentre when userType=USER
 * and the user has at least one centre (existing backend rule).
 */
export function applyCentreListScope(
  wireQuery: Record<string, unknown>,
): Record<string, unknown> {
  return {
    ...wireQuery,
    userType: "USER",
    status: wireQuery.status ?? "ACTIVE",
  };
}
export type LmsAuth = {
  token: string;
  role?: string;
  principalId?: string;
  credentialId?: string;
};

export function lmsAuthFromRequest(request: Request): LmsAuth | undefined {
  const token = request.headers
    .get("authorization")
    ?.replace(/^Bearer\s+/i, "")
    .trim();
  if (!token) return undefined;

  const role = request.headers.get("x-lms-role")?.trim();
  return role ? { token, role } : { token };
}

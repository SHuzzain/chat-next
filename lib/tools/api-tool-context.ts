import type { SessionContext } from "eve/context";

import type { LmsAuth } from "@/lib/auth";

import { lmsCredentials } from "./api-credential-store";

export interface LmsToolContext {
  userId: string;
  credentialId: string;
  token: string;
  role?: string;
  email?: string;
  name?: string;
}

export function requireLmsContext(ctx: SessionContext): LmsToolContext {
  const caller = ctx.session.auth.current;

  if (
    !caller ||
    caller.principalType !== "user" ||
    caller.authenticator !== "lms"
  ) {
    throw new Error("An authenticated LMS user is required.");
  }

  const credentialId = caller.attributes.lmsCredentialId;
  if (typeof credentialId !== "string" || !credentialId) {
    throw new Error("LMS credential is unavailable.");
  }

  const credential = lmsCredentials.read(credentialId, caller.principalId);
  const role = caller.attributes.role;
  const email = caller.attributes.email;
  const name = caller.attributes.name;

  return {
    userId: caller.principalId,
    credentialId,
    token: credential.token,
    ...(typeof role === "string" ? { role } : {}),
    ...(typeof email === "string" ? { email } : {}),
    ...(typeof name === "string" ? { name } : {}),
  };
}

export function lmsAuthFromContext(ctx: SessionContext): LmsAuth {
  const session = requireLmsContext(ctx);
  return {
    token: session.token,
    principalId: session.userId,
    credentialId: session.credentialId,
    ...(session.role ? { role: session.role } : {}),
  };
}

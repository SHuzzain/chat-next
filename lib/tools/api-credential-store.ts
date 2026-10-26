import { randomBytes } from "node:crypto";

/**
 * Process-local LMS credential cache.
 *
 * The raw bearer token and the verified principal id live only in this Map.
 * Eve session attributes store the opaque id, never the token.
 *
 * This Map is wiped when the process restarts. It is not shared across
 * instances, workers, or other processes. A tool that runs outside the
 * process that handled `lmsBearer()` cannot see the token until that
 * process authenticates a new request.
 */
const CREDENTIAL_TTL_MS = 10 * 60 * 1000;

export type LmsCredentialReason = "missing" | "expired" | "mismatch";

export class LmsCredentialError extends Error {
  readonly reason: LmsCredentialReason;

  constructor(reason: LmsCredentialReason) {
    super(
      reason === "missing"
        ? "LMS credential is unavailable."
        : reason === "expired"
          ? "LMS credential has expired."
          : "LMS credential does not match the signed-in user.",
    );
    this.name = "LmsCredentialError";
    this.reason = reason;
  }
}

type StoredCredential = {
  token: string;
  principalId: string;
  expiresAt: number;
};

export type LmsCredentialStore = {
  put(input: { token: string; principalId: string }, now?: number): string;
  read(
    credentialId: string,
    expectedPrincipalId: string,
    now?: number,
  ): { token: string; principalId: string };
  clear(): void;
};

function expiresAtFor(token: string, now: number): number {
  const cap = now + CREDENTIAL_TTL_MS;
  const payload = token.split(".")[1];
  if (!payload) return cap;
  try {
    const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      exp?: unknown;
    };
    if (typeof claims.exp === "number") {
      return Math.min(cap, claims.exp * 1000);
    }
  } catch {
    return cap;
  }
  return cap;
}

export function createLmsCredentialStore(): LmsCredentialStore {
  const entries = new Map<string, StoredCredential>();

  return {
    put(input, now = Date.now()) {
      const credentialId = randomBytes(32).toString("base64url");
      entries.set(credentialId, {
        token: input.token,
        principalId: input.principalId,
        expiresAt: expiresAtFor(input.token, now),
      });
      return credentialId;
    },
    read(credentialId, expectedPrincipalId, now = Date.now()) {
      const entry = entries.get(credentialId);
      if (!entry) throw new LmsCredentialError("missing");
      if (entry.expiresAt <= now) {
        entries.delete(credentialId);
        throw new LmsCredentialError("expired");
      }
      if (entry.principalId !== expectedPrincipalId) {
        throw new LmsCredentialError("mismatch");
      }
      return { token: entry.token, principalId: entry.principalId };
    },
    clear() {
      entries.clear();
    },
  };
}

export const lmsCredentials = createLmsCredentialStore();

export function putLmsCredential(input: { token: string; principalId: string }): string {
  return lmsCredentials.put(input);
}

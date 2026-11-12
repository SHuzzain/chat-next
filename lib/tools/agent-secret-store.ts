import { randomBytes } from "node:crypto";

/**
 * Process-local one-time secrets for agent forms (e.g. create-user password).
 *
 * Raw secret values live only in this Map. Chat messages store the opaque id.
 * Wiped on process restart; not shared across workers.
 */
const SECRET_TTL_MS = 10 * 60 * 1000;

export type AgentSecretReason = "missing" | "expired" | "mismatch";

export class AgentSecretError extends Error {
  readonly reason: AgentSecretReason;

  constructor(reason: AgentSecretReason) {
    super(
      reason === "missing"
        ? "Secret is unavailable."
        : reason === "expired"
          ? "Secret has expired."
          : "Secret does not match the signed-in user.",
    );
    this.name = "AgentSecretError";
    this.reason = reason;
  }
}

type StoredSecret = {
  values: Record<string, string>;
  principalId: string;
  expiresAt: number;
};

export type AgentSecretStore = {
  put(
    input: { values: Record<string, string>; principalId: string },
    now?: number,
  ): string;
  /** Read without consuming. */
  read(
    secretId: string,
    expectedPrincipalId: string,
    now?: number,
  ): Record<string, string>;
  /** Read and delete (one-time use). */
  take(
    secretId: string,
    expectedPrincipalId: string,
    now?: number,
  ): Record<string, string>;
  clear(): void;
};

export function createAgentSecretStore(): AgentSecretStore {
  const entries = new Map<string, StoredSecret>();

  function load(
    secretId: string,
    expectedPrincipalId: string,
    now: number,
  ): StoredSecret {
    const entry = entries.get(secretId);
    if (!entry) throw new AgentSecretError("missing");
    if (entry.expiresAt <= now) {
      entries.delete(secretId);
      throw new AgentSecretError("expired");
    }
    if (entry.principalId !== expectedPrincipalId) {
      throw new AgentSecretError("mismatch");
    }
    return entry;
  }

  return {
    put(input, now = Date.now()) {
      const secretId = randomBytes(32).toString("base64url");
      entries.set(secretId, {
        values: { ...input.values },
        principalId: input.principalId,
        expiresAt: now + SECRET_TTL_MS,
      });
      return secretId;
    },
    read(secretId, expectedPrincipalId, now = Date.now()) {
      return { ...load(secretId, expectedPrincipalId, now).values };
    },
    take(secretId, expectedPrincipalId, now = Date.now()) {
      const entry = load(secretId, expectedPrincipalId, now);
      entries.delete(secretId);
      return { ...entry.values };
    },
    clear() {
      entries.clear();
    },
  };
}

export const agentSecrets = createAgentSecretStore();

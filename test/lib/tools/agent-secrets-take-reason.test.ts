import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { AgentSecretError } from "@/lib/tools/agent-secret-store";

/** Mirrors status mapping in app/api/agent/secrets/take/route.ts */
function statusForReason(reason: AgentSecretError["reason"]): number {
  if (reason === "missing") return 404;
  if (reason === "expired") return 410;
  return 403;
}

describe("agent secrets take reason mapping", () => {
  it("maps store reasons to distinct HTTP statuses", () => {
    assert.equal(statusForReason("missing"), 404);
    assert.equal(statusForReason("expired"), 410);
    assert.equal(statusForReason("mismatch"), 403);
  });

  it("AgentSecretError exposes reason for API mapping", () => {
    assert.equal(new AgentSecretError("missing").reason, "missing");
    assert.equal(new AgentSecretError("expired").reason, "expired");
    assert.equal(new AgentSecretError("mismatch").reason, "mismatch");
  });
});

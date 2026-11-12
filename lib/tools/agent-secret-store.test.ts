import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  AgentSecretError,
  createAgentSecretStore,
} from "./agent-secret-store";

describe("agent secret store", () => {
  it("stores and takes a secret once", () => {
    const store = createAgentSecretStore();
    const id = store.put({
      values: { password: "Secret1!" },
      principalId: "user-1",
    });
    assert.deepEqual(store.take(id, "user-1"), { password: "Secret1!" });
    assert.throws(() => store.take(id, "user-1"), AgentSecretError);
  });

  it("rejects principal mismatch", () => {
    const store = createAgentSecretStore();
    const id = store.put({
      values: { password: "Secret1!" },
      principalId: "user-1",
    });
    assert.throws(() => store.read(id, "user-2"), /match/);
  });

  it("rejects expired secrets", () => {
    const store = createAgentSecretStore();
    const now = Date.now();
    const id = store.put(
      { values: { password: "Secret1!" }, principalId: "user-1" },
      now,
    );
    assert.throws(
      () => store.take(id, "user-1", now + 11 * 60 * 1000),
      /expired/,
    );
  });
});

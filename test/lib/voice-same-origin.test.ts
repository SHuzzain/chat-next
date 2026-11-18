import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isSameOriginRequest } from "../../lib/voice/same-origin";

describe("isSameOriginRequest", () => {
  it("allows missing Origin", () => {
    const request = new Request("http://localhost:3607/agent/api/realtime", {
      method: "POST",
    });
    assert.equal(isSameOriginRequest(request), true);
  });

  it("allows matching Origin", () => {
    const request = new Request("http://localhost:3607/agent/api/realtime", {
      method: "POST",
      headers: { Origin: "http://localhost:3607" },
    });
    assert.equal(isSameOriginRequest(request), true);
  });

  it("rejects cross-origin", () => {
    const request = new Request("http://localhost:3607/agent/api/realtime", {
      method: "POST",
      headers: { Origin: "https://evil.example" },
    });
    assert.equal(isSameOriginRequest(request), false);
  });
});

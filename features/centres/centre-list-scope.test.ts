import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { applyCentreListScope } from "./centre-list-scope";

describe("applyCentreListScope", () => {
  it("forces userType USER and defaults status ACTIVE", () => {
    const scoped = applyCentreListScope({ page: 1, rowPerPage: 12 });
    assert.equal(scoped.userType, "USER");
    assert.equal(scoped.status, "ACTIVE");
    assert.equal(scoped.page, 1);
  });

  it("preserves an explicit status (e.g. INACTIVE)", () => {
    const scoped = applyCentreListScope({
      status: "INACTIVE",
      textSearch: "east",
    });
    assert.equal(scoped.userType, "USER");
    assert.equal(scoped.status, "INACTIVE");
    assert.equal(scoped.textSearch, "east");
  });

  it("overwrites a non-USER userType from the caller", () => {
    const scoped = applyCentreListScope({ userType: "ADMIN" });
    assert.equal(scoped.userType, "USER");
    assert.equal(scoped.status, "ACTIVE");
  });
});
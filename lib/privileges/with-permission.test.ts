import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  assertCapabilities,
  findMissingCapability,
  normalizeCapabilityKey,
} from "./with-permission";
import type { LmsToolContext } from "@/lib/tools/api-tool-context";

const lmsStub: LmsToolContext = {
  userId: "u1",
  credentialId: "c1",
  token: "tok",
  role: "ADMIN",
};

describe("normalizeCapabilityKey", () => {
  it("maps users.create to users:create", () => {
    assert.equal(normalizeCapabilityKey("users.create"), "users:create");
  });

  it("keeps master.centre:read module dots", () => {
    assert.equal(
      normalizeCapabilityKey("master.centre:read"),
      "master.centre:read",
    );
  });

  it("maps master.centre.read to master.centre:read", () => {
    assert.equal(
      normalizeCapabilityKey("master.centre.read"),
      "master.centre:read",
    );
  });

  it("trims whitespace", () => {
    assert.equal(normalizeCapabilityKey("  users:create  "), "users:create");
  });
});

describe("findMissingCapability", () => {
  it("returns undefined when all required keys are granted", () => {
    assert.equal(
      findMissingCapability(["users:create", "users:read"], "users.create"),
      undefined,
    );
  });

  it("returns the missing key", () => {
    assert.equal(
      findMissingCapability(["users:read"], ["users:create"]),
      "users:create",
    );
  });
});

describe("assertCapabilities", () => {
  it("denies without treating loadKeys success as handler success", async () => {
    let loads = 0;
    await assert.rejects(
      () =>
        assertCapabilities(lmsStub, "users:create", async () => {
          loads += 1;
          return ["users:read"];
        }),
      /Permission denied: missing users:create/,
    );
    assert.equal(loads, 1);
  });

  it("resolves when the capability is present", async () => {
    await assertCapabilities(lmsStub, "users:create", async () => [
      "users:create",
    ]);
  });
});

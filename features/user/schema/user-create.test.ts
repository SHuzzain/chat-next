import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildUserCreateFormData,
  toUserCreateWireData,
  userCreateInputSchema,
} from "./user-create";

const baseInput = {
  centreIds: ["507f1f77bcf86cd799439011"],
  firstName: "Ada",
  lastName: "Lovelace",
  salutation: "Ms" as const,
  typeId: "507f1f77bcf86cd799439012",
  email: "ada@example.com",
  passwordSecretId: "secret-abc",
};

describe("userCreateInputSchema", () => {
  it("accepts valid create input", () => {
    const parsed = userCreateInputSchema.parse(baseInput);
    assert.equal(parsed.email, "ada@example.com");
  });

  it("rejects missing centres", () => {
    assert.throws(() =>
      userCreateInputSchema.parse({ ...baseInput, centreIds: [] }),
    );
  });
});

describe("toUserCreateWireData", () => {
  it("maps agent fields to LMS wire keys without passwordSecretId", () => {
    const wire = toUserCreateWireData(
      userCreateInputSchema.parse({
        ...baseInput,
        mobile: "91234567",
        countryCode: "+65",
        bio: "Pioneer",
      }),
      "Complex1!",
      "507f1f77bcf86cd799439013",
    );
    assert.deepEqual(wire.courseCentre, baseInput.centreIds);
    assert.equal(wire.type, baseInput.typeId);
    assert.equal(wire.language, "507f1f77bcf86cd799439013");
    assert.equal(wire.status, "ACTIVE");
    assert.equal(wire.password, "Complex1!");
    assert.equal(wire.countryCode, "+65");
    assert.equal(wire.mobile, "+6591234567");
    assert.equal(wire.Mobilephoneno, "91234567");
    assert.equal(wire.registrationBy, "ADMIN");
    assert.equal(
      "passwordSecretId" in wire,
      false,
    );
  });
});

describe("buildUserCreateFormData", () => {
  it("puts JSON string in data field", async () => {
    const wire = toUserCreateWireData(
      userCreateInputSchema.parse(baseInput),
      "Complex1!",
      "507f1f77bcf86cd799439013",
    );
    const form = buildUserCreateFormData(wire);
    const data = form.get("data");
    assert.equal(typeof data, "string");
    const parsed = JSON.parse(String(data)) as { password: string; type: string };
    assert.equal(parsed.password, "Complex1!");
    assert.equal(parsed.type, baseInput.typeId);
    assert.equal(form.get("user-avatar"), null);
  });
});

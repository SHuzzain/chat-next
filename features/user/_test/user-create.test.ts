import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildUserCreateFormData,
  registrationByFromRole,
  toUserCreateWireData,
  userCreateInputSchema,
} from "@/features/user/schema/user-create";

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

  it("accepts optional staffTypeId", () => {
    const parsed = userCreateInputSchema.parse({
      ...baseInput,
      staffTypeId: "507f1f77bcf86cd799439014",
    });
    assert.equal(parsed.staffTypeId, "507f1f77bcf86cd799439014");
  });

  it("rejects missing centres", () => {
    assert.throws(() =>
      userCreateInputSchema.parse({ ...baseInput, centreIds: [] }),
    );
  });
});

describe("registrationByFromRole", () => {
  it("defaults to ADMIN when role is missing", () => {
    assert.equal(registrationByFromRole(undefined), "ADMIN");
    assert.equal(registrationByFromRole(""), "ADMIN");
    assert.equal(registrationByFromRole("  "), "ADMIN");
  });

  it("uses the signed-in role when present", () => {
    assert.equal(registrationByFromRole("SUPER_ADMIN"), "SUPER_ADMIN");
    assert.equal(registrationByFromRole(" CENTRE_ADMIN "), "CENTRE_ADMIN");
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
        staffTypeId: "507f1f77bcf86cd799439014",
      }),
      "Complex1!",
      "507f1f77bcf86cd799439013",
      "CENTRE_ADMIN",
    );
    assert.deepEqual(wire.courseCentre, baseInput.centreIds);
    assert.equal(wire.type, baseInput.typeId);
    assert.equal(wire.language, "507f1f77bcf86cd799439013");
    assert.equal(wire.status, "ACTIVE");
    assert.equal(wire.password, "Complex1!");
    assert.equal(wire.countryCode, "+65");
    assert.equal(wire.mobile, "+6591234567");
    assert.equal(wire.Mobilephoneno, "91234567");
    assert.equal(wire.staffType, "507f1f77bcf86cd799439014");
    assert.equal(wire.registrationBy, "CENTRE_ADMIN");
    assert.equal("passwordSecretId" in wire, false);
  });

  it("defaults registrationBy to ADMIN when omitted", () => {
    const wire = toUserCreateWireData(
      userCreateInputSchema.parse(baseInput),
      "Complex1!",
      "507f1f77bcf86cd799439013",
    );
    assert.equal(wire.registrationBy, "ADMIN");
    assert.equal("staffType" in wire, false);
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
    const parsed = JSON.parse(String(data)) as {
      password: string;
      type: string;
    };
    assert.equal(parsed.password, "Complex1!");
    assert.equal(parsed.type, baseInput.typeId);
    assert.equal(form.get("user-avatar"), null);
  });

  it("appends optional user-avatar file", () => {
    const wire = toUserCreateWireData(
      userCreateInputSchema.parse(baseInput),
      "Complex1!",
      "507f1f77bcf86cd799439013",
    );
    const avatar = new File([Uint8Array.from([1, 2, 3])], "ada.png", {
      type: "image/png",
    });
    const form = buildUserCreateFormData(wire, avatar);
    const uploaded = form.get("user-avatar");
    assert.ok(uploaded instanceof File);
    assert.equal(uploaded.name, "ada.png");
  });
});

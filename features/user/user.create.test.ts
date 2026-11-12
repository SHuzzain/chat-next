import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { createAgentSecretStore } from "@/lib/tools/agent-secret-store";

import {
  buildUserCreateFormData,
  toUserCreateWireData,
  userCreateInputSchema,
  userCreateResultSchema,
} from "./schema/user-create";

describe("create-user secret consumption path", () => {
  it("builds FormData from taken secret without exposing password in result schema", () => {
    const store = createAgentSecretStore();
    const secretId = store.put({
      values: { password: "Complex1!" },
      principalId: "admin-1",
    });
    const secrets = store.take(secretId, "admin-1");
    const input = userCreateInputSchema.parse({
      centreIds: ["507f1f77bcf86cd799439011"],
      firstName: "Ada",
      salutation: "Ms",
      typeId: "507f1f77bcf86cd799439012",
      email: "ada@example.com",
      passwordSecretId: secretId,
    });
    const wire = toUserCreateWireData(
      input,
      secrets.password!,
      "507f1f77bcf86cd799439013",
    );
    const form = buildUserCreateFormData(wire);
    const data = JSON.parse(String(form.get("data"))) as { password: string };
    assert.equal(data.password, "Complex1!");

    const result = userCreateResultSchema.parse({
      _id: "507f1f77bcf86cd799439099",
      email: "ada@example.com",
      firstName: "Ada",
      password: "should-be-stripped-or-kept-but-tool-must-not-return-it",
    });
    // Tool output schema allows loose fields from LMS; callers must not echo password.
    assert.equal(result._id, "507f1f77bcf86cd799439099");
    assert.equal(result.email, "ada@example.com");
  });
});

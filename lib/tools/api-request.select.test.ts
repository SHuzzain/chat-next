import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { userInfoRowSchema } from "@/features/user/schema/user-info";

import { defaultSelectPaths, mergeDisplaySelect } from "./api-request";

describe("mergeDisplaySelect", () => {
  it("always keeps widget display fields when the agent adds question fields", () => {
    assert.deepEqual(defaultSelectPaths(userInfoRowSchema), [
      "_id",
      "fullName",
      "email",
    ]);
    assert.deepEqual(
      mergeDisplaySelect(["_id", "fullName", "mobile"], userInfoRowSchema),
      ["_id", "fullName", "email", "mobile"],
    );
  });
});

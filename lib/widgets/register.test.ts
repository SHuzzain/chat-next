import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  getWidgetSource,
  widgetSourceKeys,
  widgetSourceSchema,
} from "./register";

describe("widget source register", () => {
  it("registers every list source used by tools", () => {
    assert.deepEqual(
      [...widgetSourceKeys].sort(),
      [
        "centres",
        "class-enrollment-report",
        "class-users-report",
        "classes",
        "learner-enrollment-report",
        "lesson-overall-report",
        "user-class-score-report",
        "users",
      ].sort(),
    );
  });

  it("returns a source for known keys", () => {
    const users = getWidgetSource("users");
    assert.equal(typeof users.list, "function");
    assert.ok(users.rowSchema);
    assert.ok(users.query);
    assert.ok(users.body);
  });

  it("rejects unknown keys", () => {
    assert.throws(() => getWidgetSource("not-a-source"), /Unknown widget source/);
    assert.equal(widgetSourceSchema.safeParse("users").success, true);
    assert.equal(widgetSourceSchema.safeParse("nope").success, false);
  });
});

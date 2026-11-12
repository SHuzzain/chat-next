import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { friendlyToolLabel } from "./action-log-label";

describe("friendlyToolLabel", () => {
  it("strips folder prefix and maps list-/get- tools", () => {
    assert.equal(friendlyToolLabel("class-list-classes"), "searching classes");
    assert.equal(friendlyToolLabel("list-classes"), "searching classes");
    assert.equal(
      friendlyToolLabel("centres-list-centre"),
      "searching centres",
    );
  });

  it("maps report and session-user tools", () => {
    assert.equal(
      friendlyToolLabel("reports-class-users-report"),
      "loading class users report",
    );
    assert.equal(
      friendlyToolLabel("live-class-session-users"),
      "loading live class session users",
    );
  });

  it("applies overrides for odd names", () => {
    assert.equal(friendlyToolLabel("get-users"), "searching learners");
    assert.equal(
      friendlyToolLabel("lesson-overall-reprot"),
      "loading lesson report",
    );
    assert.equal(friendlyToolLabel("widget_form"), "showing form");
  });
});

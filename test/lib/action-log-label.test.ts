import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  attachmentActionLogLabel,
  friendlyToolLabel,
  streamingPhaseFromResult,
  toolActionLogLabel,
} from "@/lib/action-log-label";

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
    assert.equal(
      friendlyToolLabel("knowledge-search-mindchamps-knowledge"),
      "searching MindChamps knowledge",
    );
  });
});

describe("streamingPhaseFromResult", () => {
  it("reads a non-empty phase string", () => {
    assert.equal(
      streamingPhaseFromResult({ phase: "  Checking centres…  " }),
      "Checking centres…",
    );
  });

  it("ignores missing or blank phase", () => {
    assert.equal(streamingPhaseFromResult(undefined), undefined);
    assert.equal(streamingPhaseFromResult({}), undefined);
    assert.equal(streamingPhaseFromResult({ phase: "   " }), undefined);
  });
});

describe("toolActionLogLabel", () => {
  it("prefers streamed phase over the tool name", () => {
    assert.equal(
      toolActionLogLabel({
        toolName: "create-user",
        result: { phase: "Checking 2 centres…" },
      }),
      "Checking 2 centres…",
    );
  });

  it("falls back to the friendly tool name", () => {
    assert.equal(
      toolActionLogLabel({ toolName: "create-user" }),
      "creating user",
    );
  });

  it("applies cancelled and failed suffixes", () => {
    assert.equal(
      toolActionLogLabel({ toolName: "create-user", cancelled: true }),
      "creating user (cancelled)",
    );
    assert.equal(
      toolActionLogLabel({
        toolName: "create-user",
        failed: true,
        result: { phase: "ignored when failed" },
      }),
      "creating user failed",
    );
  });
});

describe("attachmentActionLogLabel", () => {
  it("describes uploading and failed uploads", () => {
    assert.equal(
      attachmentActionLogLabel({ name: "ada.png", uploading: true }),
      "uploading ada.png…",
    );
    assert.equal(
      attachmentActionLogLabel({
        name: "ada.png",
        failed: true,
        errorMessage: "too large",
      }),
      "upload failed: ada.png (too large)",
    );
  });
});

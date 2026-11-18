import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  LMS_AGENT_TOOL_NAME,
  parseLmsAgentArgs,
} from "../../lib/voice/realtime-tools";
import { claimFunctionCallId } from "../../agent/voice/tool-gateway";

describe("parseLmsAgentArgs", () => {
  it("parses JSON string arguments", () => {
    assert.deepEqual(
      parseLmsAgentArgs(JSON.stringify({ message: "List my classes" })),
      { message: "List my classes" },
    );
  });

  it("rejects empty message", () => {
    assert.throws(() => parseLmsAgentArgs({ message: "  " }));
  });

  it("accepts a plain utterance string", () => {
    assert.deepEqual(parseLmsAgentArgs("List my classes"), {
      message: "List my classes",
    });
  });
});

describe("claimFunctionCallId", () => {
  it("accepts a call id once", () => {
    const id = `call_${LMS_AGENT_TOOL_NAME}_${Date.now()}`;
    assert.equal(claimFunctionCallId(id), true);
    assert.equal(claimFunctionCallId(id), false);
  });
});

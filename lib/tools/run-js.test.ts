import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { runJs } from "./run-js";

describe("runJs", () => {
  it("returns a computed value from data", () => {
    const out = runJs({
      code: "return data.rows.filter((r) => r.score >= 50).length;",
      data: {
        rows: [{ score: 40 }, { score: 80 }, { score: 55 }],
      },
    });
    assert.equal(out.ok, true);
    assert.equal(out.result, 2);
  });

  it("captures console.log", () => {
    const out = runJs({
      code: 'console.log("hi", data.n); return data.n * 2;',
      data: { n: 3 },
    });
    assert.equal(out.ok, true);
    assert.equal(out.result, 6);
    assert.deepEqual(out.logs, ["hi 3"]);
  });

  it("blocks process access", () => {
    const out = runJs({
      code: "return process.env;",
      data: {},
    });
    assert.equal(out.ok, false);
    assert.match(String(out.error), /process/i);
  });

  it("rejects empty code", () => {
    const out = runJs({ code: "   " });
    assert.equal(out.ok, false);
  });
});

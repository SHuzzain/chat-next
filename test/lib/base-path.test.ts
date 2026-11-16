import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";

import { appBasePath, withBasePath } from "@/lib/base-path";

const previous = process.env.NEXT_PUBLIC_BASE_PATH;

afterEach(() => {
  if (previous === undefined) delete process.env.NEXT_PUBLIC_BASE_PATH;
  else process.env.NEXT_PUBLIC_BASE_PATH = previous;
});

describe("withBasePath", () => {
  it("prefixes the configured base path", () => {
    process.env.NEXT_PUBLIC_BASE_PATH = "/agent";
    assert.equal(appBasePath(), "/agent");
    assert.equal(withBasePath("/api/agent/secrets"), "/agent/api/agent/secrets");
  });

  it("returns the path unchanged when base path is empty", () => {
    process.env.NEXT_PUBLIC_BASE_PATH = "";
    assert.equal(withBasePath("/embed"), "/embed");
  });
});

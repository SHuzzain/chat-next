import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { embedQuery } from "@/features/knowledge/embed";

describe("embedQuery", () => {
  it("returns the first OpenAI embedding vector", async () => {
    const previous = process.env.OPENAI_API_KEY;
    process.env.OPENAI_API_KEY = "test-key";
    try {
      const embedding = await embedQuery("What is MindChamps?", async () =>
        Response.json({
          data: [{ embedding: [0.1, 0.2, 0.3] }],
        }),
      );
      assert.deepEqual(embedding, [0.1, 0.2, 0.3]);
    } finally {
      if (previous === undefined) delete process.env.OPENAI_API_KEY;
      else process.env.OPENAI_API_KEY = previous;
    }
  });

  it("throws when OPENAI_API_KEY is missing", async () => {
    const previous = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;
    try {
      await assert.rejects(() => embedQuery("hi"), /OPENAI_API_KEY/);
    } finally {
      if (previous !== undefined) process.env.OPENAI_API_KEY = previous;
    }
  });
});

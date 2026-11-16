import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  knowledgeSearchInputSchema,
  knowledgeSearchOutputSchema,
} from "@/features/knowledge/schema";

describe("knowledge search schemas", () => {
  it("accepts a non-empty query", () => {
    const parsed = knowledgeSearchInputSchema.parse({
      query: "Are WSQ payments refundable?",
    });
    assert.equal(parsed.query, "Are WSQ payments refundable?");
  });

  it("accepts ranked hits with optional FAQ meta", () => {
    const parsed = knowledgeSearchOutputSchema.parse({
      hits: [
        {
          text: "WSQ payments…",
          source: "mindchamps-faq",
          sourceType: "json",
          meta: { question: "Are WSQ payments refundable?" },
          score: 0.82,
        },
      ],
    });
    assert.equal(parsed.hits.length, 1);
    assert.equal(parsed.hits[0]?.sourceType, "json");
  });
});

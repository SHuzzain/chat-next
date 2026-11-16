import { defineTool } from "eve/tools";

import {
  knowledgeSearchInputSchema,
  knowledgeSearchOutputSchema,
} from "./schema";
import { searchKnowledge } from "./search";

export const searchMindchampsKnowledgeTool = defineTool({
  description: `
Search MindChamps knowledge (company info, FAQ, policies, programmes).

Use when the user asks about MindChamps as an organisation, admissions,
fees/credits (e.g. SkillsFuture), certificates, or general FAQ — not for
LMS live data (learners, centres, reports). Pass a clear natural-language
query. Answer only from the returned hits; say when nothing relevant is found.
  `,
  inputSchema: knowledgeSearchInputSchema,
  outputSchema: knowledgeSearchOutputSchema,
  execute: async ({ query }) => {
    const hits = await searchKnowledge(query);
    return { hits };
  },
  label: {
    start: () => "Searching MindChamps knowledge…",
    complete: (_input, output) =>
      output.hits.length === 0
        ? "No MindChamps knowledge matches"
        : `Found ${output.hits.length} MindChamps knowledge hit${output.hits.length === 1 ? "" : "s"}`,
  },
});

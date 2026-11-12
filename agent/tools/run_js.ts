import { defineTool } from "eve/tools";
import { z } from "zod";

import { runJs } from "@/lib/tools/run-js";

const inputSchema = z.object({
  code: z
    .string()
    .min(1)
    .max(4000)
    .describe(
      "JavaScript function body. Receives `data` and must `return` a JSON-serializable value. Example: return data.rows.length;",
    ),
  data: z
    .unknown()
    .optional()
    .describe(
      "Input from a prior LMS tool (e.g. report rows, counts). Prefer passing tool JSON, not inventing numbers.",
    ),
});

const outputSchema = z.object({
  ok: z.boolean(),
  result: z.unknown().optional(),
  logs: z.array(z.string()),
  error: z.string().optional(),
});

/**
 * Read-only JS compute for LMS tool results (aggregates, filters, comparisons).
 * No filesystem, network, or process access — keep bash disabled.
 */
export default defineTool({
  description: `
Run a short JavaScript snippet against JSON data (usually prior LMS tool output).

Use when you need exact math or transforms the model should not invent:
- counts, averages, min/max over report rows
- filter/sort/group learners or enrollments already fetched
- compare two numeric fields from tool results

Do NOT use for LMS API calls, file edits, deletes, or anything that mutates data.
The script is a function body: it receives \`data\` and must \`return\` a value.
  `,
  inputSchema,
  outputSchema,
  execute: async (input) =>
    runJs({
      code: input.code,
      data: input.data,
    }),
  label: {
    start: () => "Running calculation…",
    complete: (_input, output) =>
      output.ok ? "Calculation finished." : "Calculation failed.",
  },
});

import { defineTool } from "eve/tools";

import {
  getTimezoneParameters,
  getTimezoneResult,
} from "@/lib/widgets/schema/get-timezone";

/**
 * Model-facing time zone tool. Prefers the browser zone sent on the Eve
 * request as `x-client-timezone` (stored on the LMS principal attributes).
 */
export default defineTool({
  description: `
Get the user's current IANA time zone (for example Asia/Singapore).

Use when scheduling, comparing local times, or formatting dates for the user.
  `,
  inputSchema: getTimezoneParameters,
  outputSchema: getTimezoneResult,
  execute: async (_input, ctx) => {
    const timeZone = ctx.session.auth.current?.attributes?.timeZone;
    if (typeof timeZone === "string" && timeZone.trim()) {
      return { timeZone: timeZone.trim() };
    }
    return {
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    };
  },
  label: {
    start: () => "Reading time zone…",
    complete: (_input, output) => `Time zone: ${output.timeZone}`,
  },
});

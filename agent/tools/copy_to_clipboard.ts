import { defineTool } from "eve/tools";

import {
  copyToClipboardParameters,
  copyToClipboardResult,
} from "@/lib/widgets/schema/copy-to-clipboard";

/**
 * Model-facing clipboard tool. Eve runs this on the server; the matching
 * frontend toolkit entry writes to the browser clipboard when the call settles.
 */
export default defineTool({
  description: `
Copy text to the user's clipboard in the browser.

Use when the user asks to copy a value, id, name, report line, or other text.
Pass the exact string to copy in text. Do not invent content.
  `,
  inputSchema: copyToClipboardParameters,
  outputSchema: copyToClipboardResult,
  execute: async ({ text }) => ({ copied: true, text }),
  label: {
    start: () => "Copying text…",
    complete: () => "Copied text to clipboard",
  },
});

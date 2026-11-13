import { defineTool } from "eve/tools";

import {
  widgetFormParameters,
  widgetFormResult,
} from "@/lib/widgets/schema/widget-form";

/**
 * Model-facing form widget. Call when the user must fill multiple structured
 * fields (filters, preferences, confirm details).
 */
export default defineTool({
  description: `
Show a form so the user can enter structured answers.

Use widget_form when you need several labeled inputs at once (text, choices,
checkboxes, password, file). Do not use it for picking one LMS record from a list —
use widget_select / widget_multi_select / widget_search instead.

Every field must have a clear label. Add description, placeholder, and example
when they help the user fill the field correctly.
Prefer select or radio for closed sets, checkbox_group for multi-select options,
and a single checkbox for yes/no. Use type "password" for passwords — never ask
the user to type a password in plain chat. After submit, use passwordSecretId
from the message (not the password value) for create-user.
Use type "file" for uploads. For create-user profile photos, name the field
"avatar" and set accept/maxBytes from the create-user instructions. After submit
use avatarSecretId — never raw image bytes.

Write one short line explaining what you need, then call this tool. Wait for the
user to submit. Do not invent their answers.
  `,
  inputSchema: widgetFormParameters,
  outputSchema: widgetFormResult,
  execute: async (args) => args,
  endsTurn: true,
  label: {
    start: () => "Showing form…",
    complete: () => "Form shown",
  },
});

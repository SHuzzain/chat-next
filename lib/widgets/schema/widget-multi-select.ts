import { z } from "zod";

import { widgetOptionSchema } from "./shared";

/** Arguments for {@link widget_multi_select}. */
export const widgetMultiSelectParameters = z.object({
  entity: z.string().min(1).describe("Record type the user is choosing, e.g. Learner"),
  source: z.string().min(1).describe("List source key, e.g. users"),
  totalItems: z.number().int().nonnegative().describe("How many records matched"),
  options: z
    .array(widgetOptionSchema)
    .min(2)
    .describe("Checkbox choices. Pass through from the list tool arguments."),
});

export type WidgetMultiSelectArgs = z.infer<typeof widgetMultiSelectParameters>;

/** Echo of the arguments. The toolkit renders the checkboxes. */
export const widgetMultiSelectResult = widgetMultiSelectParameters;

export type WidgetMultiSelectResult = z.infer<typeof widgetMultiSelectResult>;

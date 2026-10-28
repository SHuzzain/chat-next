import { z } from "zod";

import { widgetOptionSchema } from "./shared";

/** Arguments for {@link widget_select}. */
export const widgetSelectParameters = z.object({
  entity: z.string().min(1).describe("Record type the user is choosing, e.g. Learner"),
  source: z.string().min(1).describe("List source key, e.g. users"),
  totalItems: z.number().int().nonnegative().describe("How many records matched"),
  options: z
    .array(widgetOptionSchema)
    .min(2)
    .describe("Radio choices. Pass through from the list tool arguments."),
});

export type WidgetSelectArgs = z.infer<typeof widgetSelectParameters>;

/** Echo of the arguments. The toolkit renders the choices. */
export const widgetSelectResult = widgetSelectParameters;

export type WidgetSelectResult = z.infer<typeof widgetSelectResult>;

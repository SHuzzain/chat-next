import { z } from "zod";

import { widgetSelectionSchema } from "./shared";

/** Arguments for {@link widget_search}. */
export const widgetSearchParameters = z.object({
  entity: z.string().min(1).describe("Record type the user is narrowing, e.g. Learner"),
  source: z.string().min(1).describe("List source key passed to the search API, e.g. users"),
  totalItems: z.number().int().nonnegative().describe("How many records matched"),
  selection: widgetSelectionSchema,
});

export type WidgetSearchArgs = z.infer<typeof widgetSearchParameters>;

/** Echo of the arguments. The toolkit renders the search input. */
export const widgetSearchResult = widgetSearchParameters;

export type WidgetSearchResult = z.infer<typeof widgetSearchResult>;

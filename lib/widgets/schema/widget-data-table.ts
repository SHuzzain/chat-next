import { z } from "zod";

/** One column the table should render. Built from the list row schema roles. */
export const widgetDataTableColumnSchema = z.object({
  key: z.string().min(1).describe("Row field path, e.g. name or user.fullName"),
  label: z.string().min(1).describe("Column header shown to the user"),
  priority: z
    .enum(["primary", "secondary"])
    .optional()
    .describe("primary is the leading column in narrow layouts"),
});

export type WidgetDataTableColumn = z.infer<typeof widgetDataTableColumnSchema>;

/** Arguments for {@link widget_data_table}. */
export const widgetDataTableParameters = z.object({
  entity: z.string().min(1).describe("Record type shown in the table, e.g. Learner"),
  source: z.string().min(1).describe("List source key, e.g. users"),
  totalItems: z.number().int().nonnegative().describe("How many records matched"),
  currentPage: z.number().int().positive().describe("1-based page index"),
  totalPage: z.number().int().positive().describe("Total pages"),
  columns: z
    .array(widgetDataTableColumnSchema)
    .min(1)
    .describe("Columns from the list row schema. Pass through unchanged."),
  data: z
    .array(z.record(z.string(), z.unknown()))
    .describe("Rows to display. Pass through from the list tool arguments."),
});

export type WidgetDataTableArgs = z.infer<typeof widgetDataTableParameters>;

/** Echo of the arguments. The toolkit renders the table. */
export const widgetDataTableResult = widgetDataTableParameters;

export type WidgetDataTableResult = z.infer<typeof widgetDataTableResult>;

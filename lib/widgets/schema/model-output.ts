import { z } from "zod";

import { widgetOptionSchema } from "./shared";
import { widgetDataTableParameters } from "./widget-data-table";
import { widgetMultiSelectParameters } from "./widget-multi-select";
import { widgetSearchParameters } from "./widget-search";
import { widgetSelectParameters } from "./widget-select";

const instruction = z.string().min(1);

const listIntentSchema = z.enum(["resolve", "show"]);

function widgetCall<T extends z.ZodType>(
  tool: "widget_select" | "widget_multi_select" | "widget_data_table" | "widget_search",
  parameters: T,
) {
  return z.object({
    nextTool: z.literal(tool),
    arguments: parameters,
    instruction,
  });
}

/** List result that tells the agent to call {@link widget_select}. */
export const widgetSelectCallSchema = widgetCall("widget_select", widgetSelectParameters);

/** List result that tells the agent to call {@link widget_multi_select}. */
export const widgetMultiSelectCallSchema = widgetCall(
  "widget_multi_select",
  widgetMultiSelectParameters,
);

/** List result that tells the agent to call {@link widget_data_table}. */
export const widgetDataTableCallSchema = widgetCall("widget_data_table", widgetDataTableParameters);

/** List result that tells the agent to call {@link widget_search}. */
export const widgetSearchCallSchema = widgetCall("widget_search", widgetSearchParameters);

/** No rows matched. The agent asks for a different search. */
export const emptyMatchValueSchema = z.object({
  source: z.string().min(1),
  intent: listIntentSchema,
  totalItems: z.literal(0),
  instruction,
});

/** One row matched. The agent continues with this record. */
export const singleRecordValueSchema = z.object({
  source: z.string().min(1),
  intent: z.literal("resolve"),
  totalItems: z.literal(1),
  record: widgetOptionSchema.extend({
    row: z.record(z.string(), z.unknown()).optional(),
  }),
  instruction,
});

/** Resolve/show note that does not open a widget. */
export const messageValueSchema = z.object({
  source: z.string().min(1),
  intent: listIntentSchema,
  totalItems: z.number().int().nonnegative(),
  instruction,
});

/**
 * JSON value returned from a list tool's `toModelOutput`.
 * Widget bands are calls; empty and single-record bands are not.
 */
export const listModelValueSchema = z.union([
  widgetSelectCallSchema,
  widgetMultiSelectCallSchema,
  widgetDataTableCallSchema,
  widgetSearchCallSchema,
  singleRecordValueSchema,
  emptyMatchValueSchema,
  messageValueSchema,
]);

export type ListModelValue = z.infer<typeof listModelValueSchema>;

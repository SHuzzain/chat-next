import { defineTool } from "eve/tools";
import { z } from "zod";

import type { LmsAuth } from "@/lib/auth";
import { listModelValueSchema } from "@/lib/widgets/schema/model-output";
import {
  listPurposes,
  listSelections,
  toWidgetAdvanceFilterOutput,
  type ListPurpose,
  type ListSelection,
  type WidgetPage,
} from "@/lib/widgets/present";

import { mergeDisplaySelect } from "./api-request";
import { lmsAuthFromContext } from "./api-tool-context";

function asWidgetPage(value: unknown): WidgetPage {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const record = value as Record<string, unknown>;
  return {
    data: Array.isArray(record.data) ? record.data : [],
    totalItems:
      typeof record.totalItems === "number" ? record.totalItems : undefined,
    currentPage:
      typeof record.currentPage === "number" || record.currentPage === null
        ? record.currentPage
        : undefined,
    totalPage:
      typeof record.totalPage === "number" ? record.totalPage : undefined,
  };
}

function asRequestRecord(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  return value as Record<string, unknown>;
}

function widgetView(
  data: unknown,
  config: {
    entry: string;
    source: string;
    rowSchema: z.ZodType;
  },
  purpose: ListPurpose,
  selection: ListSelection,
  request?: { query?: unknown; body?: unknown },
) {
  return toWidgetAdvanceFilterOutput({
    schema: asWidgetPage(data),
    config: {
      source: config.source,
      entity: config.entry,
      purpose,
      selection,
      rowSchema: config.rowSchema,
      query: asRequestRecord(request?.query),
      body: asRequestRecord(request?.body),
    },
  }).value;
}

export function createPaginatedTool<
  TQuery extends z.ZodType,
  TBody extends z.ZodType,
  TOutput extends z.ZodType,
>(config: {
  description: string;
  querySchema: TQuery;
  bodySchema: TBody;
  outputSchema: TOutput;
  widget: {
    entry: string;
    source: string;
    rowSchema: z.ZodType;
  };
  execute: (
    input: { query: z.infer<TQuery>; body: z.infer<TBody> },
    auth: LmsAuth,
  ) => Promise<z.infer<TOutput>>;
}) {
  type ToolInput = {
    query: z.infer<TQuery>;
    body: z.infer<TBody>;
    purpose?: ListPurpose;
    selection?: ListSelection;
  };

  return defineTool({
    description: config.description,
    inputSchema: z.object({
      query: config.querySchema,
      body: config.bodySchema,
      purpose: z
        .enum(listPurposes)
        .optional()
        .describe(
          "Use resolve when a later step needs the selected record id. Use show when the list itself is the answer. Extra advanceFilterSelect fields should match the question; display fields are merged automatically.",
        ),
      selection: z
        .enum(listSelections)
        .optional()
        .describe(
          "Use single when the question needs one record. Use multi when the user asked for several records.",
        ),
    }),
    outputSchema: z.object({
      data: config.outputSchema,
      purpose: z.enum(listPurposes),
      selection: z.enum(listSelections),
      view: listModelValueSchema,
    }),
    execute: async (input, ctx) => {
      const parsed = input as ToolInput;
      const incomingBody: Record<string, unknown> =
        parsed.body &&
        typeof parsed.body === "object" &&
        !Array.isArray(parsed.body)
          ? Object.assign({}, parsed.body as Record<string, unknown>)
          : {};
      const body = Object.assign({}, incomingBody, {
        advanceFilterSelect: mergeDisplaySelect(
          Array.isArray(incomingBody.advanceFilterSelect)
            ? (incomingBody.advanceFilterSelect as string[])
            : undefined,
          config.widget.rowSchema,
        ),
      }) as z.infer<TBody>;
      const data = config.outputSchema.parse(
        await config.execute(
          { query: parsed.query, body },
          lmsAuthFromContext(ctx),
        ),
      );
      const purpose = parsed.purpose ?? "show";
      const selection = parsed.selection ?? "single";

      return {
        data,
        purpose,
        selection,
        view: widgetView(data, config.widget, purpose, selection, {
          query: parsed.query,
          body,
        }),
      };
    },
    toModelOutput: (output) => {
      const parsed = output as {
        data: unknown;
        view?: Record<string, unknown>;
        purpose?: ListPurpose;
        selection?: ListSelection;
      };
      if (parsed.view) return { type: "json" as const, value: parsed.view };
      return toWidgetAdvanceFilterOutput({
        schema: asWidgetPage(parsed.data),
        config: {
          source: config.widget.source,
          entity: config.widget.entry,
          purpose: parsed.purpose ?? "show",
          selection: parsed.selection ?? "single",
          rowSchema: config.widget.rowSchema,
        },
      });
    },
  });
}

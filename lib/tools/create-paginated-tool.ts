import { defineTool } from "eve/tools";
import type { SessionContext } from "eve/context";
import { z } from "zod";

import type { LmsAuth } from "@/lib/auth";
import { withPermission } from "@/lib/privileges/with-permission";
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
import { lmsAuthFromContext, type LmsToolContext } from "./api-tool-context";

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
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }
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

function authFromLms(lms: LmsToolContext): LmsAuth {
  return {
    token: lms.token,
    principalId: lms.userId,
    credentialId: lms.credentialId,
    ...(lms.role ? { role: lms.role } : {}),
  };
}

/** Copy a tool body object, or `{}` when missing / not a plain object. */
function copyBody(body: unknown): Record<string, unknown> {
  if (!body || typeof body !== "object" || Array.isArray(body)) return {};
  return { ...body };
}

/**
 * Ensure widget display columns stay in `advanceFilterSelect`
 * even when the model only asked for a few fields.
 */
function bodyWithDisplaySelect<TBody>(
  body: unknown,
  rowSchema: z.ZodType,
): TBody {
  const next = copyBody(body);
  const existing = Array.isArray(next.advanceFilterSelect)
    ? (next.advanceFilterSelect as string[])
    : undefined;
  next.advanceFilterSelect = mergeDisplaySelect(existing, rowSchema);
  return next as TBody;
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
  /** Catalog capability key(s); when set, gates execute via withPermission. */
  permission?: string | string[];
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

  const entity = config.widget.entry.toLowerCase();

  async function runList(input: ToolInput, auth: LmsAuth) {
    const purpose = input.purpose ?? "show";
    const selection = input.selection ?? "single";
    const body = bodyWithDisplaySelect<z.infer<TBody>>(
      input.body,
      config.widget.rowSchema,
    );

    const data = config.outputSchema.parse(
      await config.execute({ query: input.query, body }, auth),
    );

    return {
      data,
      purpose,
      selection,
      view: widgetView(data, config.widget, purpose, selection, {
        query: input.query,
        body,
      }),
    };
  }

  const execute = config.permission
    ? withPermission(config.permission, async (input, lms) =>
        runList(input as ToolInput, authFromLms(lms)),
      )
    : async (input: unknown, ctx: SessionContext) =>
        runList(input as ToolInput, lmsAuthFromContext(ctx));

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
    label: {
      start: () => `Searching ${entity}s…`,
      complete: () => `Found ${entity}s`,
    },
    execute,
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

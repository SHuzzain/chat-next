import { defineTool, type ToolModelOutput } from "eve/tools";
import { z } from "zod";

import type { LmsAuth } from "@/lib/auth";
import {
  listPurposes,
  listSelections,
  presentList,
  toWidgetModelOutput,
  widgetUiSchema,
  widgetWaitsForUser,
  type ListPurpose,
  type ListSelection,
  type WidgetUi,
} from "@/lib/widgets/present";

import { lmsAuthFromContext } from "./api-tool-context";

export function createPaginatedTool<
  TQuery extends z.ZodType,
  TBody extends z.ZodType,
  TOutput extends z.ZodType,
>(config: {
  description: string;
  querySchema: TQuery;
  bodySchema: TBody;
  outputSchema: TOutput;
  execute: (
    input: { query: z.infer<TQuery>; body: z.infer<TBody> },
    auth: LmsAuth,
  ) => Promise<z.infer<TOutput>>;
  transformOutput?: (output: z.infer<TOutput>) => ToolModelOutput;
  present?: {
    source: string;
    entity: string;
    plural: string;
    rowSchema: z.ZodType;
  };
}) {
  type ToolInput = {
    query: z.infer<TQuery>;
    body: z.infer<TBody>;
    purpose?: ListPurpose;
    selection?: ListSelection;
  };

  if (!config.present) {
    return defineTool({
      description: config.description,
      inputSchema: z.object({
        query: config.querySchema,
        body: config.bodySchema,
      }),
      outputSchema: config.outputSchema,
      execute: async (input, ctx) => {
        const parsed = input as ToolInput;
        const output = await config.execute(
          { query: parsed.query, body: parsed.body },
          lmsAuthFromContext(ctx),
        );
        return config.outputSchema.parse(output);
      },
      ...(config.transformOutput
        ? { toModelOutput: config.transformOutput }
        : {}),
    });
  }

  const present = config.present;
  return defineTool({
    description: config.description,
    inputSchema: z.object({
      query: config.querySchema,
      body: config.bodySchema,
      purpose: z
        .enum(listPurposes)
        .optional()
        .describe(
          "Use resolve when a later step needs the selected record id. Use show when the list itself is the answer.",
        ),
      selection: z
        .enum(listSelections)
        .optional()
        .describe(
          "Use single when the question needs one record. Use multi when the user asked for several records.",
        ),
    }),
    outputSchema: z.object({
      ui: widgetUiSchema,
    }),
    execute: async (input, ctx) => {
      const parsed = input as ToolInput;
      const output = await config.execute(
        { query: parsed.query, body: parsed.body },
        lmsAuthFromContext(ctx),
      );
      const page = config.outputSchema.parse(output);
      const ui = widgetUiSchema.parse(
        presentList({
          page,
          query: parsed.query,
          body: parsed.body,
          rowSchema: present.rowSchema,
          source: present.source,
          entity: present.entity,
          plural: present.plural,
          purpose: parsed.purpose ?? "resolve",
          selection: parsed.selection ?? "single",
        }),
      );
      return { ...page, ui };
    },
    endsTurn: (output) => widgetWaitsForUser((output.ui as WidgetUi).widget),
    toModelOutput: (output) => toWidgetModelOutput(output),
  });
}

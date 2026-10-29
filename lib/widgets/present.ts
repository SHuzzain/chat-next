import { z } from "zod";

import type { LMSPage } from "../tools/api-response";
import { fieldWithRole, tableColumns } from "./roles";
import {
  emptyMatchValueSchema,
  listModelValueSchema,
  messageValueSchema,
  singleRecordValueSchema,
  widgetDataTableCallSchema,
  widgetMultiSelectCallSchema,
  widgetSearchCallSchema,
  widgetSelectCallSchema,
  type ListModelValue,
} from "./schema/model-output";
import type { WidgetDataTableColumn } from "./schema/widget-data-table";
import type { WidgetOption } from "./schema/shared";

export type { WidgetOption } from "./schema/shared";

export const INLINE_CHOICE_MAX = 12;

export const listPurposes = ["resolve", "show", "select"] as const;
export const listSelections = ["single", "multi"] as const;

export type ListPurpose = (typeof listPurposes)[number];
export type ListSelection = (typeof listSelections)[number];

/** Page fields the widget reads. A Zod page transform still matches this shape. */
export type WidgetPage = {
  data?: unknown[];
  totalItems?: number;
  currentPage?: number | null;
  totalPage?: number;
};

/** Format any cell value for table / choice display. No field-name special cases. */
export function displayValue(value: unknown): string {
  if (value == null || value === false) return "";
  if (typeof value === "string" || typeof value === "number")
    return String(value);
  if (typeof value === "boolean") return value ? "Yes" : "";
  if (Array.isArray(value)) {
    return value.map(displayValue).filter(Boolean).join(", ");
  }
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    if (typeof record.name === "string" && record.name) return record.name;
    if (typeof record.fullName === "string" && record.fullName)
      return record.fullName;
    if (typeof record.begin === "string" || typeof record.end === "string") {
      return [record.begin, record.end].filter(Boolean).join(" – ");
    }
  }
  return "";
}

function readPath(row: Record<string, unknown>, path: string): unknown {
  let current: unknown = row;
  for (const key of path.split(".")) {
    if (!current || typeof current !== "object" || Array.isArray(current)) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}

function setPath(
  target: Record<string, unknown>,
  path: string,
  value: unknown,
): void {
  const parts = path.split(".");
  let current = target;
  for (let index = 0; index < parts.length - 1; index += 1) {
    const part = parts[index]!;
    const next = current[part];
    if (!next || typeof next !== "object" || Array.isArray(next)) {
      current[part] = {};
    }
    current = current[part] as Record<string, unknown>;
  }
  current[parts[parts.length - 1]!] = value;
}

export function cell(
  row: Record<string, unknown>,
  field: string | undefined,
): string {
  if (!field) return "";
  return displayValue(readPath(row, field));
}

function asRow(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value))
    return undefined;
  return value as Record<string, unknown>;
}

function choiceOption(
  row: Record<string, unknown>,
  fields: { label?: string; value?: string; detail?: string },
): WidgetOption | undefined {
  const id = cell(row, fields.value);
  if (!id) return undefined;
  const label = cell(row, fields.label) || id;
  const detail = cell(row, fields.detail);
  return detail ? { id, label, detail } : { id, label };
}

function choiceOptions(rows: unknown[], rowSchema: z.ZodType): WidgetOption[] {
  const fields = {
    label: fieldWithRole(rowSchema, "label"),
    value: fieldWithRole(rowSchema, "value"),
    detail: fieldWithRole(rowSchema, "detail"),
  };
  return rows.flatMap((item) => {
    const row = asRow(item);
    if (!row) return [];
    const option = choiceOption(row, fields);
    return option ? [option] : [];
  });
}

function tableRows(
  rows: unknown[],
  columns: WidgetDataTableColumn[],
  rowSchema: z.ZodType,
): Array<Record<string, unknown>> {
  const valueKey = fieldWithRole(rowSchema, "value") ?? "_id";
  const keys = [...new Set([valueKey, ...columns.map((column) => column.key)])];
  return rows.flatMap((item) => {
    const row = asRow(item);
    if (!row) return [];
    const slim: Record<string, unknown> = {};
    for (const key of keys) {
      const value = readPath(row, key);
      if (value !== undefined) setPath(slim, key, value);
    }
    return [slim];
  });
}

function json(value: ListModelValue): { type: "json"; value: ListModelValue } {
  return { type: "json", value: listModelValueSchema.parse(value) };
}

export function toWidgetAdvanceFilterOutput(output: {
  schema?: WidgetPage | LMSPage<z.ZodObject<z.ZodRawShape>>;
  config: {
    entity: string;
    source: string;
    purpose: ListPurpose;
    selection: ListSelection;
    rowSchema: z.ZodType;
    query?: Record<string, unknown>;
    body?: Record<string, unknown>;
  };
}): { type: "json"; value: ListModelValue } {
  const { schema, config } = output;
  const data = schema?.data ?? [];
  const totalItems = schema?.totalItems || data.length;
  const purpose = config.purpose === "select" ? "resolve" : config.purpose;

  if (totalItems === 0 || data.length === 0) {
    return json(
      emptyMatchValueSchema.parse({
        source: config.source,
        intent: purpose,
        totalItems: 0,
        instruction:
          `No ${config.entity} matched. ` +
          "Ask the user for a different or more specific search.",
      }),
    );
  }

  if (purpose === "show") {
    const columns = tableColumns(config.rowSchema);
    const table =
      columns.length > 0
        ? columns
        : [
            {
              key: fieldWithRole(config.rowSchema, "value") ?? "_id",
              label: "Id",
            },
          ];
    return json(
      widgetDataTableCallSchema.parse({
        nextTool: "widget_data_table",
        arguments: {
          entity: config.entity,
          source: config.source,
          totalItems,
          currentPage: schema?.currentPage ?? 1,
          totalPage: schema?.totalPage ?? 1,
          columns: table,
          data: tableRows(data, table, config.rowSchema),
          ...(config.query ? { query: config.query } : {}),
          ...(config.body ? { body: config.body } : {}),
        },
        instruction:
          "Call widget_data_table now with the given arguments. " +
          `Display the matching ${config.entity} records. ` +
          "Do not ask the user to select a record unless requested.",
      }),
    );
  }

  const options = choiceOptions(data, config.rowSchema);

  if (totalItems === 1 && data.length === 1) {
    const option = options[0];
    const row = asRow(data[0]);
    if (!option) {
      return json(
        messageValueSchema.parse({
          source: config.source,
          intent: "resolve",
          totalItems: 1,
          instruction:
            `One ${config.entity} matched but it has no id. ` +
            "Ask the user for a different search.",
        }),
      );
    }
    return json(
      singleRecordValueSchema.parse({
        source: config.source,
        intent: "resolve",
        totalItems: 1,
        record: row ? { ...option, row } : option,
        instruction:
          `One ${config.entity} matched. Use this record and continue ` +
          "the user's requested task.",
      }),
    );
  }

  if (totalItems <= INLINE_CHOICE_MAX && options.length >= 2) {
    const single = config.selection === "single";
    const choiceArgs = {
      entity: config.entity,
      source: config.source,
      totalItems,
      options,
    };
    if (single) {
      return json(
        widgetSelectCallSchema.parse({
          nextTool: "widget_select",
          arguments: choiceArgs,
          instruction:
            "Call widget_select now with the given arguments. " +
            `Wait for the user to choose one ${config.entity}. Do not guess an id.`,
        }),
      );
    }
    return json(
      widgetMultiSelectCallSchema.parse({
        nextTool: "widget_multi_select",
        arguments: choiceArgs,
        instruction:
          "Call widget_multi_select now with the given arguments. " +
          `Wait for the user to choose one or more ${config.entity}. Do not guess ids.`,
      }),
    );
  }

  if (totalItems <= INLINE_CHOICE_MAX) {
    return json(
      messageValueSchema.parse({
        source: config.source,
        intent: "resolve",
        totalItems,
        instruction:
          `Multiple ${config.entity} matched but they have no selectable ids. ` +
          "Ask the user for a different or more specific search.",
      }),
    );
  }

  return json(
    widgetSearchCallSchema.parse({
      nextTool: "widget_search",
      arguments: {
        entity: config.entity,
        source: config.source,
        totalItems,
        selection: config.selection,
      },
      instruction:
        "Call widget_search now with the given arguments. " +
        `Found ${totalItems} matching ${config.entity} records. ` +
        "Ask the user to narrow the search in the search input. Do not list the rows.",
    }),
  );
}

export function selectionMessage(
  entity: string,
  plural: string,
  options: Array<{ id: string; label: string }>,
) {
  const noun =
    options.length === 1 ? entity.toLowerCase() : plural.toLowerCase();
  const list = options
    .map((option) => `${option.label} (_id: ${option.id})`)
    .join(", ");
  return `Selected ${noun}: ${list}`;
}

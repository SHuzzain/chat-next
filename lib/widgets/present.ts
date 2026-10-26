import { z } from "zod";

import { fieldWithRole } from "./roles";

export const INLINE_CHOICE_MAX = 6;

export const listPurposes = ["resolve", "show"] as const;
export const listSelections = ["single", "multi"] as const;

export type ListPurpose = (typeof listPurposes)[number];
export type ListSelection = (typeof listSelections)[number];

const optionSchema = z.object({
  id: z.string(),
  label: z.string(),
  detail: z.string().optional(),
});

const namesSchema = {
  entity: z.string(),
  plural: z.string(),
};

const querySchema = z.record(z.string(), z.unknown());

export const widgetUiSchema = z.discriminatedUnion("widget", [
  z.object({
    widget: z.literal("continue"),
    ...namesSchema,
    rows: z.array(optionSchema),
  }),
  z.object({
    widget: z.literal("empty"),
    ...namesSchema,
  }),
  z.object({
    widget: z.enum(["radio", "checkbox"]),
    ...namesSchema,
    totalItems: z.number(),
    options: z.array(optionSchema).min(1),
  }),
  z.object({
    widget: z.enum(["async-select", "async-multi-select"]),
    ...namesSchema,
    source: z.string(),
    query: querySchema,
    body: querySchema,
    totalItems: z.number(),
  }),
  z.object({
    widget: z.literal("data-table"),
    ...namesSchema,
    source: z.string(),
    query: querySchema,
    body: querySchema,
    columns: z.array(z.object({ key: z.string(), header: z.string() })),
    rows: z.array(z.record(z.string(), z.string())),
    totalItems: z.number(),
    totalPage: z.number(),
    currentPage: z.number(),
  }),
]);

export type WidgetUi = z.infer<typeof widgetUiSchema>;
export type WidgetOption = z.infer<typeof optionSchema>;

export type WidgetId = WidgetUi["widget"];

const choiceWidgets = new Set<WidgetId>([
  "radio",
  "checkbox",
  "async-select",
  "async-multi-select",
]);

export function widgetWaitsForUser(widget: WidgetId): boolean {
  return choiceWidgets.has(widget);
}

export function chooseWidget(input: {
  purpose: ListPurpose;
  selection: ListSelection;
  count: number;
  exactCount: number;
}): WidgetId {
  if (input.count <= 0) return "empty";
  if (input.exactCount === 1 || input.count === 1) return "continue";
  if (input.purpose === "show") {
    return input.count > INLINE_CHOICE_MAX ? "data-table" : "continue";
  }
  if (input.count <= INLINE_CHOICE_MAX) {
    return input.selection === "multi" ? "checkbox" : "radio";
  }
  return input.selection === "multi" ? "async-multi-select" : "async-select";
}

type Page = {
  data?: unknown[];
  totalItems?: number;
  totalPage?: number;
  currentPage?: number | null;
  userGridColumn?: Record<string, unknown> | null;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export function cell(row: Record<string, unknown>, field: string | undefined) {
  if (!field) return "";
  const value = row[field];
  if (typeof value === "string" || typeof value === "number") return String(value);
  return "";
}

function jsonObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
}

function filterNeedles(body: unknown): string[] {
  const filters = asRecord(body).advanceFilter;
  if (!Array.isArray(filters)) return [];

  const needles: string[] = [];
  for (const filter of filters) {
    const record = asRecord(filter);
    if (record.type !== "Equals" && record.type !== "Contains") continue;
    if (!Array.isArray(record.value)) continue;
    for (const item of record.value) {
      if (typeof item !== "string" && typeof item !== "number") continue;
      const text = String(item).trim().toLowerCase();
      if (text) needles.push(text);
    }
  }
  return needles;
}

function toOption(
  row: Record<string, unknown>,
  fields: { value?: string; label?: string; detail?: string },
): WidgetOption | undefined {
  const id = cell(row, fields.value);
  if (!id) return undefined;
  const label = cell(row, fields.label) || id;
  const detail = cell(row, fields.detail);
  return detail ? { id, label, detail } : { id, label };
}

function tableColumns(page: Page, labelField: string | undefined, detailField: string | undefined) {
  const grid = page.userGridColumn;
  if (grid && typeof grid === "object") {
    const keys = Object.keys(grid).filter((key) => key !== "_id");
    if (keys.length > 0) return keys.map((key) => ({ key, header: key }));
  }
  return [labelField, detailField]
    .filter((key): key is string => Boolean(key))
    .map((key) => ({ key, header: key }));
}

export function presentList(input: {
  page: Page;
  query: unknown;
  body: unknown;
  rowSchema: z.ZodType;
  source: string;
  entity: string;
  plural: string;
  purpose: ListPurpose;
  selection: ListSelection;
}): WidgetUi {
  const rows = (input.page.data ?? []).map(asRecord);
  const fields = {
    label: fieldWithRole(input.rowSchema, "label"),
    value: fieldWithRole(input.rowSchema, "value"),
    detail: fieldWithRole(input.rowSchema, "detail"),
    search: fieldWithRole(input.rowSchema, "search") ?? fieldWithRole(input.rowSchema, "label"),
  };
  const options = rows
    .map((row) => toOption(row, fields))
    .filter((option): option is WidgetOption => option !== undefined);
  const needles = filterNeedles(input.body);
  const exact = needles.length
    ? options.filter((option) => {
        const texts = [option.label, option.detail ?? ""]
          .map((text) => text.trim().toLowerCase())
          .filter(Boolean);
        return needles.some((needle) => texts.includes(needle));
      })
    : [];
  const count = input.page.totalItems ?? rows.length;
  const widget = chooseWidget({
    purpose: input.purpose,
    selection: input.selection,
    count,
    exactCount: exact.length,
  });

  const names = { entity: input.entity, plural: input.plural };
  if (widget === "empty") return { widget, ...names };
  if (widget === "continue") {
    const chosen = exact.length === 1 ? exact : options;
    return { widget, ...names, rows: chosen };
  }
  if (widget === "radio" || widget === "checkbox") {
    if (options.length === 0) return { widget: "empty", ...names };
    return {
      widget,
      ...names,
      totalItems: count,
      options,
    };
  }

  const query = jsonObject(input.query);
  const body = jsonObject(input.body);
  if (widget === "data-table") {
    const columns = tableColumns(input.page, fields.label, fields.detail);
    return {
      widget,
      ...names,
      source: input.source,
      query,
      body,
      columns,
      rows: rows.map((row) =>
        Object.fromEntries(columns.map((column) => [column.key, cell(row, column.key)])),
      ),
      totalItems: count,
      totalPage: input.page.totalPage ?? 1,
      currentPage: input.page.currentPage ?? 1,
    };
  }

  return {
    widget,
    ...names,
    source: input.source,
    query,
    body,
    totalItems: count,
  };
}

export function toWidgetModelOutput(output: {
  ui?: WidgetUi;
  totalItems?: number;
  data?: unknown[];
}): { type: "json"; value: unknown } {
  const ui = output.ui;
  const totalItems = output.totalItems ?? output.data?.length ?? 0;
  if (!ui || ui.widget === "continue") {
    return {
      type: "json",
      value: {
        totalItems,
        rows: ui?.widget === "continue" ? ui.rows : [],
      },
    };
  }
  if (ui.widget === "empty") {
    return {
      type: "json",
      value: {
        totalItems: 0,
        instruction: `No ${ui.entity} matched. Ask for a more specific name.`,
      },
    };
  }
  if (ui.widget === "data-table") {
    return {
      type: "json",
      value: {
        widget: ui.widget,
        totalItems: ui.totalItems,
        instruction: `A table of ${ui.totalItems} ${ui.plural} is on screen. Summarize the count. Do not list every row.`,
      },
    };
  }
  return {
    type: "json",
    value: {
      widget: ui.widget,
      totalItems: ui.totalItems,
      instruction: `A ${ui.entity} picker is on screen (${ui.totalItems} matches). Wait for the user's selection. Do not list the rows and do not call ask_question.`,
    },
  };
}

export function selectionMessage(
  entity: string,
  plural: string,
  options: Array<{ id: string; label: string }>,
) {
  const noun = options.length === 1 ? entity.toLowerCase() : plural.toLowerCase();
  const list = options.map((option) => `${option.label} (_id: ${option.id})`).join(", ");
  return `Selected ${noun}: ${list}`;
}

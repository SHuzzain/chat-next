import { lmsAuthFromRequest } from "@/lib/auth";
import { fieldPaths } from "@/lib/tools/api-field-paths";
import { LmsApiError } from "@/lib/tools/api-client";
import { cell } from "@/lib/widgets/present";
import { getWidgetSource, widgetSourceSchema } from "@/lib/widgets/register";
import { fieldWithRole } from "@/lib/widgets/roles";
import { z } from "zod";

const requestSchema = z.object({
  source: widgetSourceSchema,
  query: z.record(z.string(), z.unknown()).optional(),
  body: z.record(z.string(), z.unknown()).optional(),
  search: z.string().optional(),
  page: z.number().int().min(1).optional(),
  columns: z.array(z.string()).optional(),
});

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
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

function projectRows(
  rows: Array<Record<string, unknown>>,
  columns: string[],
  valueKey: string,
): Array<Record<string, unknown>> {
  if (columns.length === 0) return rows;
  const keys = [...new Set([valueKey, ...columns])];
  return rows.map((row) => {
    const slim: Record<string, unknown> = {};
    for (const key of keys) {
      const value = readPath(row, key);
      if (value !== undefined) setPath(slim, key, value);
    }
    return slim;
  });
}

export async function POST(request: Request) {
  const auth = lmsAuthFromRequest(request);
  if (!auth) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ message: "Invalid search request." }, { status: 400 });
  }

  const source = getWidgetSource(parsed.data.source);
  const search = parsed.data.search?.trim() ?? "";
  const searchField =
    fieldWithRole(source.rowSchema, "search") ??
    fieldWithRole(source.rowSchema, "label");
  const rawBody = { ...parsed.data.body };
  if (search && searchField) {
    const existing = Array.isArray(rawBody.advanceFilter)
      ? rawBody.advanceFilter
      : [];
    rawBody.advanceFilter = [
      ...existing,
      { field: searchField, type: "Contains", value: [search] },
    ];
  }

  const query = source.query.safeParse({
    ...parsed.data.query,
    page: parsed.data.page ?? 1,
    rowPerPage: 12,
  });
  const body = source.body.safeParse(rawBody);
  if (!query.success || !body.success) {
    return Response.json({ message: "Invalid search request." }, { status: 400 });
  }

  try {
    const page = await source.list(query.data, auth, body.data);
    const rows = (page.data ?? []).map(asRecord);
    const fields = {
      label: fieldWithRole(source.rowSchema, "label"),
      value: fieldWithRole(source.rowSchema, "value"),
      detail: fieldWithRole(source.rowSchema, "detail"),
    };
    const allowed = new Set(fieldPaths(source.rowSchema));
    const columns = (parsed.data.columns ?? []).filter((key) => allowed.has(key));
    const options = rows.flatMap((row) => {
      const id = cell(row, fields.value);
      if (!id) return [];
      const label = cell(row, fields.label) || id;
      const detail = cell(row, fields.detail);
      return [detail ? { id, label, detail } : { id, label }];
    });

    const valueKey = fields.value ?? "_id";
    return Response.json({
      options,
      rows: projectRows(rows, columns, valueKey),
      totalItems: page.totalItems ?? options.length,
      totalPage: page.totalPage ?? 1,
      currentPage: page.currentPage ?? (query.data as { page?: number }).page ?? 1,
    });
  } catch (error) {
    const status = error instanceof LmsApiError ? error.status : 500;
    const message =
      error instanceof LmsApiError ? error.message : "LMS search failed.";
    return Response.json({ message }, { status });
  }
}

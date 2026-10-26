import { classListSchema } from "@/features/class/schema";
import { listClasses } from "@/features/class/class.api";
import { classRowSchema } from "@/features/class/schema/class-list";
import { listUsers } from "@/features/user/user.api";
import { userInfoListSchema, userInfoRowSchema } from "@/features/user/schema";
import { lmsAuthFromRequest } from "@/lib/auth";
import { fieldPaths } from "@/lib/tools/api-field-paths";
import { LmsApiError } from "@/lib/tools/api-client";
import { cell } from "@/lib/widgets/present";
import { fieldWithRole } from "@/lib/widgets/roles";
import { z } from "zod";

const sources = {
  classes: {
    list: listClasses,
    query: classListSchema.query,
    body: classListSchema.body,
    rowSchema: classRowSchema,
  },
  users: {
    list: listUsers,
    query: userInfoListSchema.query,
    body: userInfoListSchema.body,
    rowSchema: userInfoRowSchema,
  },
} as const;

const requestSchema = z.object({
  source: z.enum(["classes", "users"]),
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

export async function POST(request: Request) {
  const auth = lmsAuthFromRequest(request);
  if (!auth) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ message: "Invalid search request." }, { status: 400 });
  }

  const source = sources[parsed.data.source];
  const search = parsed.data.search?.trim() ?? "";
  const searchField =
    fieldWithRole(source.rowSchema, "search") ?? fieldWithRole(source.rowSchema, "label");
  const rawBody = { ...parsed.data.body };
  if (search && searchField) {
    const existing = Array.isArray(rawBody.advanceFilter) ? rawBody.advanceFilter : [];
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

    return Response.json({
      options,
      rows: rows.map((row) => Object.fromEntries(columns.map((key) => [key, cell(row, key)]))),
      totalItems: page.totalItems ?? options.length,
      totalPage: page.totalPage ?? 1,
      currentPage: page.currentPage ?? query.data.page ?? 1,
    });
  } catch (error) {
    const status = error instanceof LmsApiError ? error.status : 500;
    const message = error instanceof LmsApiError ? error.message : "LMS search failed.";
    return Response.json({ message }, { status });
  }
}

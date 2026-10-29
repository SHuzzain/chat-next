import type { WidgetOption } from "@/lib/widgets/present";

export type WidgetListRequest = {
  source: string;
  search?: string;
  page?: number;
  columns?: string[];
  query?: Record<string, unknown>;
  body?: Record<string, unknown>;
  token: string;
  role?: string;
  signal?: AbortSignal;
};

export type WidgetListResponse = {
  options: WidgetOption[];
  rows: Array<Record<string, unknown>>;
  totalItems: number;
  totalPage: number;
  currentPage: number;
  message?: string;
};

export async function fetchWidgetList(
  input: WidgetListRequest,
): Promise<WidgetListResponse> {
  const response = await fetch("/api/lms/search", {
    method: "POST",
    signal: input.signal,
    headers: {
      Authorization: `Bearer ${input.token}`,
      "Content-Type": "application/json",
      ...(input.role ? { "x-lms-role": input.role } : {}),
    },
    body: JSON.stringify({
      source: input.source,
      search: input.search,
      page: input.page,
      columns: input.columns,
      query: input.query,
      body: input.body,
    }),
  });
  const payload = (await response.json()) as WidgetListResponse;
  if (!response.ok) {
    throw new Error(payload.message || "Widget list request failed.");
  }
  return {
    options: payload.options ?? [],
    rows: payload.rows ?? [],
    totalItems: payload.totalItems ?? payload.options?.length ?? 0,
    totalPage: payload.totalPage ?? 1,
    currentPage: payload.currentPage ?? input.page ?? 1,
  };
}

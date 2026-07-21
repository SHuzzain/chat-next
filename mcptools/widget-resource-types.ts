/**
 * Shared types/helpers for declarative widget data resources.
 * Prefer `defineWidgetResource(agentHttpCall)` so endpoint/params come from agent HTTP defs.
 */

import type { HttpCallDefinition } from "@/lib/http-call";

export type WidgetDataResponse = {
  data: unknown[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
};

/** httpExecute wiring only — request args from the widget/AI are trusted. */
export type WidgetResourceDefinition = {
  endpoint: string;
  method: "GET" | "POST";
  pathParams: readonly string[];
  queryParams: readonly string[];
  bodyParams: readonly string[];
  maxPageSize: number;
  mapResponse: (
    raw: unknown,
    page: number,
    pageSize: number,
  ) => WidgetDataResponse;
};

/** Build a widget resource from an agent `HttpCallDefinition` — do not re-list params. */
export function defineWidgetResource(
  call: HttpCallDefinition & { method: "GET" | "POST" },
  options: {
    maxPageSize?: number;
    mapResponse?: (
      raw: unknown,
      page: number,
      pageSize: number,
    ) => WidgetDataResponse;
  } = {},
): WidgetResourceDefinition {
  return {
    endpoint: call.endpoint,
    method: call.method,
    pathParams: call.pathParams ?? [],
    queryParams: call.queryParams ?? [],
    bodyParams: call.bodyParams ?? [],
    maxPageSize: options.maxPageSize ?? 50,
    mapResponse: options.mapResponse ?? mapPaginatedPayload,
  };
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

/** Common LMS list payload mapper: `{ payload: { data, totalItems, totalPage, currentPage } }`. */
export function mapPaginatedPayload(
  raw: unknown,
  page: number,
  pageSize: number,
): WidgetDataResponse {
  const root = asRecord(raw);
  const payload = asRecord(root.payload ?? root);
  const data = Array.isArray(payload.data)
    ? payload.data
    : Array.isArray(root.data)
      ? root.data
      : [];
  const totalItems =
    Number(payload.totalItems ?? root.totalItems ?? data.length) || 0;
  const totalPages =
    Number(payload.totalPage ?? payload.totalPages ?? root.totalPage ?? 0) ||
    Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage =
    Number(payload.currentPage ?? root.currentPage ?? page) || page;

  return {
    data,
    pagination: {
      page: currentPage,
      pageSize,
      totalItems,
      totalPages,
      hasNextPage: currentPage < totalPages,
      hasPreviousPage: currentPage > 1,
    },
  };
}

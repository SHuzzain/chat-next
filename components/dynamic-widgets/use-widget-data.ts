"use client";

import { useMemo } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

import type {
  ResourceName,
  WidgetDataResponse,
} from "@/lib/dynamic-widgets/schemas";
import { useWidgetAuth } from "./widget-auth-context";

export type UseWidgetDataArgs = {
  resource: ResourceName;
  pathParams?: Record<string, string>;
  params?: Record<string, unknown>;
  body?: Record<string, unknown>;
  select?: string[];
  page?: number;
  pageSize?: number;
  search?: string;
  sortField?: string;
  sortDirection?: "asc" | "desc";
  enabled?: boolean;
};

async function fetchWidgetData(
  args: UseWidgetDataArgs & { token: string; origin: string },
  signal: AbortSignal,
): Promise<WidgetDataResponse> {
  const response = await fetch("/api/widget-data", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${args.token}`,
      "x-lms-origin": args.origin,
    },
    body: JSON.stringify({
      resource: args.resource,
      origin: args.origin,
      pathParams: args.pathParams,
      params: args.params,
      body: args.body,
      select: args.select,
      pagination: {
        page: args.page ?? 1,
        pageSize: args.pageSize ?? 20,
      },
      search: args.search,
      sort:
        args.sortField && args.sortDirection
          ? { field: args.sortField, direction: args.sortDirection }
          : undefined,
    }),
    signal,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(
      typeof err?.error === "string" ? err.error : "Failed to load widget data",
    );
  }

  return response.json();
}

export function useWidgetData(args: UseWidgetDataArgs) {
  const { token, origin } = useWidgetAuth();
  const enabled = args.enabled !== false && Boolean(token) && Boolean(origin);

  const queryKey = useMemo(
    () => [
      "widget-data",
      args.resource,
      args.pathParams,
      args.params,
      args.body,
      args.select,
      args.page,
      args.pageSize,
      args.search,
      args.sortField,
      args.sortDirection,
    ],
    [args],
  );

  return useQuery({
    queryKey,
    enabled,
    placeholderData: keepPreviousData,
    queryFn: ({ signal }) =>
      fetchWidgetData({ ...args, token, origin }, signal),
  });
}

import type { HttpCallDefinition } from "@/lib/http-call";

/**
 * LMS widget data resources. Domain allowlists previously lived in /mcptools
 * and will be added again later.
 */
export type WidgetResourceDefinition = HttpCallDefinition & {
  pathParams: readonly string[];
  queryParams: readonly string[];
  bodyParams: readonly string[];
  maxPageSize: number;
  mapResponse: (raw: unknown, page: number, pageSize: number) => unknown;
};

export const WIDGET_RESOURCES: Record<string, WidgetResourceDefinition> = {};

export type ResourceName = string;

export const RESOURCE_NAMES: readonly string[] = [];

/**
 * Aggregates widget data resources from each MCP domain.
 * Add a domain's `*.widget-resources.ts` here when it exposes remote widget data.
 */

import { courseWidgetResources } from "@/mcptools/courses/course.widget-resources";
import { courseCentreWidgetResources } from "@/mcptools/course-centres/course-centre.widget-resources";
import { userWidgetResources } from "@/mcptools/users/user.widget-resources";
import type { WidgetResourceDefinition } from "@/mcptools/widget-resource-types";

export const WIDGET_RESOURCES = {
  ...userWidgetResources,
  ...courseWidgetResources,
  ...courseCentreWidgetResources,
} as const satisfies Record<string, WidgetResourceDefinition>;

export type ResourceName = keyof typeof WIDGET_RESOURCES;

/** Tuple for Zod `z.enum(...)` — derived from domain widget resources. */
export const RESOURCE_NAMES = Object.keys(WIDGET_RESOURCES) as [
  ResourceName,
  ...ResourceName[],
];

export type {
  WidgetResourceDefinition,
  WidgetDataResponse,
} from "./widget-resource-types";
export {
  defineWidgetResource,
  mapPaginatedPayload,
} from "./widget-resource-types";

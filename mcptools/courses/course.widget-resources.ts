import type { HttpCallDefinition } from "@/lib/http-call";
import {
  defineWidgetResource,
  type WidgetResourceDefinition,
} from "@/mcptools/widget-resource-types";

/** No agent MCP list tool yet — local HTTP def until courses domain adds one. */
const coursesHttp = {
  endpoint: "/courses",
  method: "GET",
  queryParams: [
    "page",
    "rowPerPage",
    "textSearch",
    "status",
    "order",
    "orderBy",
    "courseCentre",
  ],
} as const satisfies HttpCallDefinition;

/** Widget data resources owned by the courses domain. */
export const courseWidgetResources = {
  courses: defineWidgetResource(coursesHttp),
} as const satisfies Record<string, WidgetResourceDefinition>;

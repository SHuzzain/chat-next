import type { HttpCallDefinition } from "@/lib/http-call";

/** Agent HTTP calls for the course-centres domain — single source for MCP + widgets. */
export const findCentresHttp = {
  endpoint: "/course-centres/advance-filter",
  method: "POST",
  queryParams: [
    "gridType",
    "page",
    "rowPerPage",
    "textSearch",
    "status",
    "order",
    "orderBy",
    "businessType",
  ],
  bodyParams: ["advanceFilter", "advanceFilterSelect"],
} as const satisfies HttpCallDefinition;

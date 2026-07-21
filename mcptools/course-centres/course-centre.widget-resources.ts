import {
  defineWidgetResource,
  type WidgetResourceDefinition,
} from "@/mcptools/widget-resource-types";
import { findCentresHttp } from "@/mcptools/course-centres/course-centre.http";

/** Widget data resources owned by the course-centres domain — HTTP shape from agent calls. */
export const courseCentreWidgetResources = {
  course_centres: defineWidgetResource(findCentresHttp),
} as const satisfies Record<string, WidgetResourceDefinition>;

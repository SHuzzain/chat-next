import { tool, type ToolSet } from "ai";

import { httpExecute } from "@/lib/http-call";
import {
  advanceFilterParamsSchema,
  objectIdSchema,
  responseWithPaginationSchema,
} from "@/mcptools/shared";
import * as ToolSchemas from "./course-centre.tool-schemas";
import { findCentresHttp } from "./course-centre.http";

export const courseCentreMcpZodTools = (
  origin: string,
  token: string,
): ToolSet => {
  return {
    find_centres: tool({
      description: [
        "Search course centres using text search and advanced filters.",
        "Use textSearch for partial name or code matching.",
        "Return only fields needed to identify the centre, preferably _id, name, and code.",
        "Use this to resolve a centre before entity-specific tools.",
        "When multiple centres match, do not guess — prefer render_widget async-select.",
      ].join(" "),
      inputSchema: advanceFilterParamsSchema(
        ToolSchemas.getCourseCentresItemSchema,
        "CENTRE",
      ).extend({
        businessType: objectIdSchema
          .optional()
          .describe("Business type MongoId filter"),
      }),
      execute: httpExecute({
        ...findCentresHttp,
        origin,
        token,
      }),
      outputSchema: responseWithPaginationSchema(
        ToolSchemas.getCourseCentresItemSchema,
      ),
    }),
  };
};

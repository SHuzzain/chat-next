import { tool, type ToolSet } from "ai";
import { z } from "zod";

import { httpExecute } from "@/lib/http-call";
import {
  advanceFilterParamsSchema,
  objectIdSchema,
  responseWithPaginationSchema,
} from "@/mcptools/shared";
import * as ToolSchemas from "./unit.tool-schemas";
import { ChatToolHeaders } from "@/types/chat";

export const unitMcpZodTools = (headers: ChatToolHeaders): ToolSet => {
  return {
    /** -------------------- list_test_reports -------------------- */
    list_test_reports: tool({
      description: [
        "Get paginated test (unit type TEST) reports via advanceFilter.",
        "Use textSearch for quick title search, or advanceFilter field='title' with type Contains.",
        "course is optional intake/class MongoId — omit when searching tests by title across accessible classes.",
        "Prefer returning _id, title, and course._id so a follow-up detail tool can use them.",
      ].join(" "),
      inputSchema: advanceFilterParamsSchema(
        ToolSchemas.getTestReportsItemSchema,
        "GLOBAL_TEST_REPORTS",
      ).extend({
        course: objectIdSchema
          .optional()
          .describe(
            "Optional intake/class MongoId. Omit when searching by test title across classes.",
          ),
        courseCentre: objectIdSchema
          .optional()
          .describe("Optional course centre MongoId filter."),
      }),
      execute: httpExecute({
        ...headers,
        endpoint: "/report/get-report-test",
        method: "POST",
        queryParams: [
          "gridType",
          "page",
          "rowPerPage",
          "textSearch",
          "order",
          "orderBy",
          "course",
          "courseCentre",
        ],
        bodyParams: ["advanceFilter", "advanceFilterSelect"],
      }),
      outputSchema: responseWithPaginationSchema(
        z.array(ToolSchemas.getTestReportsItemSchema),
      ),
    }),
  };
};

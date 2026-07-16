import { tool, ToolSet } from "ai";
import { z } from "zod";
import { httpExecute } from "@/lib/http-call";
import { businessTypeSchema } from "./schema/business-type";
import { centreTypeSchema } from "./schema/centre-type";
import { courseCentreSchema } from "./schema/course-centre";
import { organisationSchema } from "./schema/organisation";
import {
  advanceFilterParamsSchema,
  objectIdSchema,
  responseWithPaginationSchema,
} from "./schema/shared";
import { userSchema } from "./schema/user";

const populatedCreatorSchema = userSchema.omit({
  password: true,
  oldEmail: true,
  oldUsername: true,
  __v: true,
  unreadMessage: true,
});

const getCourseCentresItemSchema = courseCentreSchema
  .omit({
    state: true,
    city: true,
    country: true,
  })
  .extend({
    // Populated refs from aggregation
    creator: populatedCreatorSchema.optional(),
    organisation: organisationSchema.partial().loose().optional(),
    businessType: businessTypeSchema.partial().loose().optional(),
    centreType: centreTypeSchema.partial().loose().optional(),
    // Aggregate-only fields
    Creditpoints: z.string().optional().describe("get number as string"),
    stEngineeringPriority: z.number().optional(),
    demeritPointsData: z.number().optional(),
  });

export const courseCentreMcpZodTools = (
  origin: string,
  token: string,
): ToolSet => {
  return {
    /** -------------------- advanced_search_filters -------------------- */
    advanced_search_filters: tool({
      description:
        'List course centres Supports advanceFilter and to reduce payload.',
      inputSchema: advanceFilterParamsSchema(
        getCourseCentresItemSchema,
        "CENTRE",
      ).extend({
        businessType: objectIdSchema.describe("Business type MongoId filter"),
      }),
      execute: httpExecute({
        endpoint: "/course-centres/advance-filter",
        method: "POST",
        origin,
        token,
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
      }),
      outputSchema: responseWithPaginationSchema(getCourseCentresItemSchema),
    }),
  };
};

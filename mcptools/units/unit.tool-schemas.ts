import { z } from "zod";

import {
  dateIsoSchema,
  dateSchema,
  objectIdSchema,
  statusSchema,
} from "@/mcptools/shared";
import { courseSchema } from "../courses";
import { courseCentreSchema } from "../course-centres";

/**
 * Placeholder item schema for POST /report/get-report-test.
 * Used for advanceFilter field paths + temporary output typing.
 * Replace / extend when the real response schema is provided.
 */
export const getTestReportsItemSchema = z
  .object({
    _id: objectIdSchema,
    title: z.string(),

    avg_position: z.number().nullable(),
    compeleted: z.number(),
    course: courseSchema.pick({
      _id: true,
      name: true,
      code: true,
      status: true,
    }),
    courseCentre: z.array(
      courseCentreSchema.pick({
        _id: true,
        name: true,
        code: true,
        createdAt: true,
      }),
    ),
    courseUserNames: z.array(objectIdSchema),
    createdAt: dateIsoSchema,

    graded: z.number(),
    inprogress: z.number(),
    failed: z.number(),
    total: z.number(),
    reattempt: z.number(),
    order: z.number(),
    status: statusSchema,
    testStarted: z.number(),
  })
  .describe("Test report list row");

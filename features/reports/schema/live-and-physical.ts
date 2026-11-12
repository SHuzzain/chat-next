import { z } from "zod";

import { mongoIdSchema } from "@/lib/zod/primitives";
import { lmsListBodySchema } from "@/lib/tools/api-request";
import {
  paginationQuerySchema,
  withAllowedSort,
} from "@/lib/tools/api-pagination";
import { lmsPageSchema } from "@/lib/tools/api-response";
import {
  CENTRE_ID_DESCRIBE,
  CLASS_ID_DESCRIBE,
  FieldAlias,
} from "@/lib/tools/api-wire";

import { centreAlias, classCentreAliases } from "./aliases";

const centreNameRefSchema = z.looseObject({
  _id: mongoIdSchema.optional(),
  name: z.string().optional(),
  code: z.string().optional(),
});

const liveLessonTypeSchema = z.enum([
  "CLASSROOM",
  "LIVESTREAMING",
  "MSTEAMS_MEETING",
]);

const gradeStatusSchema = z.enum(["PASSED", "PENDING", "NOT_PASSED"]);

const epochMsSchema = z.union([z.number(), z.string()]);

/** Agent path → LMS path for Online/Physical Class lesson list. */
export const liveClassFields = new FieldAlias({
  ...classCentreAliases,
  enrolledCount: "total",
  joinedCount: "totalJoined",
  notJoinedCount: "totalNotJoined",
  session: "classLastTime",
  startAt: "startTime",
  endAt: "endTime",
  // Non-compositional: startAt/endAt under session map differently than alone.
  "session.startAt": "classLastTime.startTime",
  "session.endAt": "classLastTime.endTime",
});

/** Agent-facing row for POST reports/get-course-liveclasses-reports. */
export const reportLiveClassRowSchema = z.looseObject({
  _id: mongoIdSchema
    .optional()
    .describe("Lesson / unit record id")
    .meta({ ui: { role: "value" } }),
  title: z
    .string()
    .optional()
    .describe("Lesson Name")
    .meta({ ui: { roles: ["label", "search"] } }),
  type: liveLessonTypeSchema
    .optional()
    .describe("Lesson type")
    .meta({ ui: { role: "column" } }),
  class: z
    .array(
      z.looseObject({
        _id: mongoIdSchema.optional(),
        name: z.string().optional(),
      }),
    )
    .optional()
    .describe("Class for this lesson"),
  centre: z
    .array(centreNameRefSchema)
    .optional()
    .describe("Centres for this lesson"),
  event: z
    .looseObject({
      _id: mongoIdSchema.optional(),
    })
    .optional()
    .describe("Live session event; use event._id for session-users"),
  enrolledCount: z
    .number()
    .optional()
    .describe("Enrolled")
    .meta({ ui: { role: "column" } }),
  joinedCount: z
    .number()
    .optional()
    .describe("Joined")
    .meta({ ui: { role: "column" } }),
  notJoinedCount: z
    .number()
    .optional()
    .describe("Not Joined")
    .meta({ ui: { role: "column" } }),
  session: z
    .looseObject({
      startAt: epochMsSchema.optional().describe("Start At"),
      endAt: epochMsSchema.optional().describe("End At"),
    })
    .optional()
    .describe("Last session time window"),
});

/** LMS wire row for get-course-liveclasses-reports. */
export const reportLiveClassWireRowSchema = z.looseObject({
  _id: mongoIdSchema.optional(),
  title: z.string().optional(),
  type: liveLessonTypeSchema.optional(),
  course: z
    .array(
      z.looseObject({
        _id: mongoIdSchema.optional(),
        name: z.string().optional(),
      }),
    )
    .optional(),
  courseCentre: z.array(centreNameRefSchema).optional(),
  event: z
    .looseObject({
      _id: mongoIdSchema.optional(),
    })
    .optional(),
  total: z.number().optional(),
  totalJoined: z.number().optional(),
  totalNotJoined: z.number().optional(),
  classLastTime: z
    .looseObject({
      startTime: epochMsSchema.optional(),
      endTime: epochMsSchema.optional(),
    })
    .optional(),
});

const reportLiveClassQuerySchema = withAllowedSort(
  paginationQuerySchema.extend({
    classId: mongoIdSchema.describe(CLASS_ID_DESCRIBE).optional(),
    centreId: mongoIdSchema.describe(CENTRE_ID_DESCRIBE).optional(),
    type: liveLessonTypeSchema.optional().describe("Filter by lesson type"),
    textSearch: z.string().optional().describe("Search lesson title"),
  }),
  reportLiveClassRowSchema,
);

export const reportLiveClassSchema = {
  query: reportLiveClassQuerySchema,
  body: lmsListBodySchema(reportLiveClassRowSchema),
  output: lmsPageSchema(reportLiveClassRowSchema),
};

export const liveSessionUserFields = new FieldAlias({
  ...centreAlias,
  lesson: "unit",
  class: "courses",
  userCentre: "courseusers",
  eventId: "session",
});

const lessonRefSchema = z.looseObject({
  _id: mongoIdSchema.optional(),
  title: z.string().optional(),
  type: liveLessonTypeSchema.optional(),
});

const lessonOrListSchema = z.union([lessonRefSchema, z.array(lessonRefSchema)]);

/** Agent-facing row for POST session-users/:eventId/users. */
export const reportLiveSessionUserRowSchema = z.looseObject({
  _id: mongoIdSchema
    .optional()
    .describe("Session-user attendance record id")
    .meta({ ui: { role: "value" } }),
  user: z
    .looseObject({
      fullName: z
        .string()
        .optional()
        .meta({ ui: { roles: ["label", "search"] } }),
    })
    .optional()
    .describe("Learner"),
  lesson: lessonOrListSchema.optional().describe("Lesson for this session"),
  userCentre: z
    .array(
      z.looseObject({
        centre: z.array(centreNameRefSchema).optional(),
      }),
    )
    .optional()
    .describe("Enrolment centres for the learner"),
  class: z
    .looseObject({
      name: z.string().optional(),
    })
    .optional()
    .describe("Class name"),
  gradeStatus: gradeStatusSchema
    .optional()
    .describe("Grade status")
    .meta({ ui: { role: "column" } }),
  tracking: z
    .array(
      z.looseObject({
        timeJoined: z.string().optional(),
        timeLeft: z.string().optional(),
      }),
    )
    .optional()
    .describe("Join / leave tracking intervals"),
  eventId: mongoIdSchema.optional().describe("Live session event id"),
});

/** LMS wire row for session-users/:id/users. */
export const reportLiveSessionUserWireRowSchema = z.looseObject({
  _id: mongoIdSchema.optional(),
  user: z
    .looseObject({
      fullName: z.string().optional(),
    })
    .optional(),
  unit: lessonOrListSchema.optional(),
  courseusers: z
    .array(
      z.looseObject({
        courseCentre: z.array(centreNameRefSchema).optional(),
      }),
    )
    .optional(),
  courses: z
    .looseObject({
      name: z.string().optional(),
    })
    .optional(),
  gradeStatus: gradeStatusSchema.optional(),
  tracking: z
    .array(
      z.looseObject({
        timeJoined: z.string().optional(),
        timeLeft: z.string().optional(),
      }),
    )
    .optional(),
  session: mongoIdSchema.optional(),
});

const reportLiveSessionUserQuerySchema = withAllowedSort(
  paginationQuerySchema.extend({
    eventId: mongoIdSchema.describe(
      "Live session event id from the Online/Physical Class list (event._id)",
    ),
    centreId: mongoIdSchema.describe(CENTRE_ID_DESCRIBE).optional(),
  }),
  reportLiveSessionUserRowSchema,
);

export const reportLiveSessionUserSchema = {
  query: reportLiveSessionUserQuerySchema,
  body: lmsListBodySchema(reportLiveSessionUserRowSchema),
  output: lmsPageSchema(reportLiveSessionUserRowSchema),
};

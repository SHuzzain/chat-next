import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { z } from "zod";

import { FieldAlias } from "@/lib/tools/api-wire";

const classCentreAliases = {
  class: "course",
  centre: "courseCentre",
} as const;

const centreAlias = {
  centre: "courseCentre",
} as const;

/** Mirrors enrollFields — keep in sync with user-schema.ts */
const enrollFields = new FieldAlias({
  ...centreAlias,
  enrolledClassesCount: "assignedCourses",
  completedClassesCount: "completedCourses",
  userRoleTypes: "type",
  userStatus: "status",
});

/** Mirrors classScoreFields — keep in sync with user-schema.ts */
const classScoreFields = new FieldAlias({
  ...classCentreAliases,
});

/** Mirrors classUsersFields — keep in sync with class-users.schema.ts */
const classUsersFields = new FieldAlias({
  ...classCentreAliases,
  userCentre: "userCourseCentres",
});

/** Mirrors liveClassFields — keep in sync with live-and-physical.ts */
const liveClassFields = new FieldAlias({
  ...classCentreAliases,
  enrolledCount: "total",
  joinedCount: "totalJoined",
  notJoinedCount: "totalNotJoined",
  session: "classLastTime",
  startAt: "startTime",
  endAt: "endTime",
  "session.startAt": "classLastTime.startTime",
  "session.endAt": "classLastTime.endTime",
});

/** Mirrors liveSessionUserFields — keep in sync with live-and-physical.ts */
const liveSessionUserFields = new FieldAlias({
  ...centreAlias,
  lesson: "unit",
  class: "courses",
  userCentre: "courseusers",
  eventId: "session",
});

const enrollRowSchema = z.object({
  fullName: z.string().optional(),
  courseCentre: z
    .array(z.object({ _id: z.string().optional(), name: z.string().optional() }))
    .optional(),
  assignedCourses: z.number().optional(),
  completedCourses: z.number().optional(),
  type: z.array(z.object({ name: z.string().optional() })).optional(),
  status: z.string().optional(),
  course: z.object({ name: z.string().optional() }).optional(),
});

describe("FieldAlias.toWireRequest", () => {
  it("maps query ids and filter/select paths in one call", () => {
    assert.deepEqual(
      enrollFields.toWireRequest({
        query: {
          page: 1,
          classId: "class-1",
          centreId: "centre-1",
          order: "centre.name",
          orderBy: "asc",
        },
        body: {
          advanceFilterSelect: ["fullName", "centre.name", "centre.code"],
          advanceFilter: [
            {
              field: "centre.name",
              type: "Equals",
              value: ["Chennai"],
            },
          ],
        },
      }),
      {
        query: {
          page: 1,
          course: "class-1",
          courseCentre: "centre-1",
          order: "courseCentre.name",
          orderBy: "asc",
        },
        body: {
          advanceFilterSelect: [
            "fullName",
            "courseCentre.name",
            "courseCentre.code",
          ],
          advanceFilter: [
            {
              field: "courseCentre.name",
              type: "Equals",
              value: ["Chennai"],
            },
          ],
        },
      },
    );
  });

  it("maps enroll counts to LMS assignedCourses and completedCourses", () => {
    const { query, body } = enrollFields.toWireRequest({
      query: { page: 1, order: "enrolledClassesCount", orderBy: "desc" },
      body: {
        advanceFilterSelect: ["fullName", "enrolledClassesCount", "completedClassesCount"],
        advanceFilter: [
          { field: "enrolledClassesCount", type: "Range", value: [2, 999999] },
        ],
      },
    });
    assert.equal(query.order, "assignedCourses");
    assert.deepEqual(body.advanceFilterSelect, [
      "fullName",
      "assignedCourses",
      "completedCourses",
    ]);
    assert.deepEqual(body.advanceFilter, [
      { field: "assignedCourses", type: "Range", value: [2, 999999] },
    ]);
  });

  it("preserves filter type and value", () => {
    const { body } = enrollFields.toWireRequest({
      body: {
        advanceFilter: [
          { field: "fullName", type: "Contains", value: ["Ada"] },
        ],
      },
    });
    assert.deepEqual(body.advanceFilter, [
      { field: "fullName", type: "Contains", value: ["Ada"] },
    ]);
  });

  it("maps class paths when endpoint treats course as Class", () => {
    assert.equal(classScoreFields.toApiField("class.name"), "course.name");
    const { body } = classScoreFields.toWireRequest({
      body: {
        advanceFilterSelect: ["class", "centre.name", "user.centre"],
      },
    });
    assert.deepEqual(body.advanceFilterSelect, [
      "course",
      "courseCentre.name",
      "user.courseCentre",
    ]);
  });

  it("omits empty id values and supports idMap override", () => {
    assert.deepEqual(
      new FieldAlias().toWireRequest({
        query: {
          page: 1,
          classId: "",
          centreId: null,
          parentCourseId: "parent-1",
        },
        idMap: { parentCourseId: "course" },
      }),
      {
        query: { page: 1, course: "parent-1" },
        body: {},
      },
    );
  });
});

describe("FieldAlias.outputSchema", () => {
  it("renames LMS keys inside page data", () => {
    const page = enrollFields.outputSchema(enrollRowSchema).parse({
      data: [
        {
          fullName: "Ada",
          courseCentre: [{ _id: "bbbbbbbbbbbbbbbbbbbbbbbb", name: "East" }],
          assignedCourses: 3,
          completedCourses: 1,
          type: [{ name: "Learner" }],
          status: "ACTIVE",
          course: { name: "Parent Course Template" },
        },
      ],
      totalItems: 1,
    });

    assert.deepEqual(page, {
      data: [
        {
          fullName: "Ada",
          centre: [{ _id: "bbbbbbbbbbbbbbbbbbbbbbbb", name: "East" }],
          enrolledClassesCount: 3,
          completedClassesCount: 1,
          userRoleTypes: [{ name: "Learner" }],
          userStatus: "ACTIVE",
          course: { name: "Parent Course Template" },
        },
      ],
      totalItems: 1,
    });
  });

  it("renames course to class only when that alias exists", () => {
    const row = z.object({
      course: z.object({ name: z.string().optional() }).optional(),
      courseCentre: z.array(z.object({ name: z.string() })).optional(),
    });
    const page = classScoreFields.outputSchema(row).parse({
      data: [
        {
          course: { name: "Math 101" },
          courseCentre: [{ name: "East" }],
        },
      ],
    });

    assert.deepEqual(page.data, [
      {
        class: { name: "Math 101" },
        centre: [{ name: "East" }],
      },
    ]);
  });

  it("renames class roster wire keys for agent output", () => {
    const row = z.object({
      course: z.object({ name: z.string().optional() }).optional(),
      userCourseCentres: z
        .array(z.object({ name: z.string().optional() }))
        .optional(),
      user: z
        .object({
          fullName: z.string().optional(),
          courseCentre: z.array(z.object({ name: z.string() })).optional(),
        })
        .optional(),
    });
    const page = classUsersFields.outputSchema(row).parse({
      data: [
        {
          course: { name: "vulnerability check" },
          userCourseCentres: [{ name: "NIshant Test Centre" }],
          user: {
            fullName: "Ajith123 Naruto",
            courseCentre: [{ name: "East" }],
          },
        },
      ],
    });

    assert.deepEqual(page.data, [
      {
        class: { name: "vulnerability check" },
        userCentre: [{ name: "NIshant Test Centre" }],
        user: {
          fullName: "Ajith123 Naruto",
          centre: [{ name: "East" }],
        },
      },
    ]);
  });

  it("renames live-class list wire keys for agent output", () => {
    const row = z.object({
      title: z.string().optional(),
      type: z.string().optional(),
      course: z.array(z.object({ name: z.string().optional() })).optional(),
      courseCentre: z
        .array(z.object({ name: z.string().optional() }))
        .optional(),
      event: z.object({ _id: z.string().optional() }).optional(),
      total: z.number().optional(),
      totalJoined: z.number().optional(),
      totalNotJoined: z.number().optional(),
      classLastTime: z
        .object({
          startTime: z.union([z.number(), z.string()]).optional(),
          endTime: z.union([z.number(), z.string()]).optional(),
        })
        .optional(),
    });
    const page = liveClassFields.outputSchema(row).parse({
      data: [
        {
          title: "Orientation",
          type: "LIVESTREAMING",
          course: [{ name: "Math 101" }],
          courseCentre: [{ name: "East" }],
          event: { _id: "evt1" },
          total: 20,
          totalJoined: 12,
          totalNotJoined: 8,
          classLastTime: { startTime: 1700000000000, endTime: 1700003600000 },
        },
      ],
    });

    assert.deepEqual(page.data, [
      {
        title: "Orientation",
        type: "LIVESTREAMING",
        class: [{ name: "Math 101" }],
        centre: [{ name: "East" }],
        event: { _id: "evt1" },
        enrolledCount: 20,
        joinedCount: 12,
        notJoinedCount: 8,
        session: { startAt: 1700000000000, endAt: 1700003600000 },
      },
    ]);
  });

  it("maps live-class list centreId and keeps courseId on the wire", () => {
    assert.deepEqual(
      liveClassFields.toWireRequest({
        query: {
          courseId: "c1",
          centreId: "ct1",
          type: "CLASSROOM",
        },
      }).query,
      { courseId: "c1", courseCentre: "ct1", type: "CLASSROOM" },
    );
  });

  it("renames live session-user wire keys for agent output", () => {
    const row = z.object({
      _id: z.string().optional(),
      user: z.object({ fullName: z.string().optional() }).optional(),
      unit: z
        .object({
          title: z.string().optional(),
          type: z.string().optional(),
          _id: z.string().optional(),
        })
        .optional(),
      courses: z.object({ name: z.string().optional() }).optional(),
      courseusers: z
        .array(
          z.object({
            courseCentre: z
              .array(z.object({ name: z.string().optional() }))
              .optional(),
          }),
        )
        .optional(),
      gradeStatus: z.string().optional(),
      session: z.string().optional(),
      tracking: z
        .array(
          z.object({
            timeJoined: z.string().optional(),
            timeLeft: z.string().optional(),
          }),
        )
        .optional(),
    });
    const page = liveSessionUserFields.outputSchema(row).parse({
      data: [
        {
          _id: "su1",
          user: { fullName: "Ada Lovelace" },
          unit: { title: "Orientation", type: "CLASSROOM", _id: "u1" },
          courses: { name: "Math 101" },
          courseusers: [{ courseCentre: [{ name: "East" }] }],
          gradeStatus: "PASSED",
          session: "evt1",
          tracking: [
            {
              timeJoined: "2024-01-01T10:00:00.000Z",
              timeLeft: "2024-01-01T11:00:00.000Z",
            },
          ],
        },
      ],
    });

    assert.deepEqual(page.data, [
      {
        _id: "su1",
        user: { fullName: "Ada Lovelace" },
        lesson: { title: "Orientation", type: "CLASSROOM", _id: "u1" },
        class: { name: "Math 101" },
        userCentre: [{ centre: [{ name: "East" }] }],
        gradeStatus: "PASSED",
        eventId: "evt1",
        tracking: [
          {
            timeJoined: "2024-01-01T10:00:00.000Z",
            timeLeft: "2024-01-01T11:00:00.000Z",
          },
        ],
      },
    ]);
  });

  it("renames class-enrollment centre without renaming class display name", () => {
    const classEnrollmentFields = new FieldAlias({ ...centreAlias });
    const row = z.object({
      class: z.string().optional(),
      courseCentre: z.array(z.object({ name: z.string() })).optional(),
    });
    const page = classEnrollmentFields.outputSchema(row).parse({
      data: [{ class: "Math 101", courseCentre: [{ name: "East" }] }],
    });
    assert.deepEqual(page.data, [
      { class: "Math 101", centre: [{ name: "East" }] },
    ]);
    assert.equal(
      classEnrollmentFields.toApiField("centre.name"),
      "courseCentre.name",
    );
  });

  it("renames lesson-overall centre only", () => {
    const lessonOverallFields = new FieldAlias({ ...centreAlias });
    const row = z.object({
      class: z.string().optional(),
      unit: z.string().optional(),
      courseCentre: z.array(z.object({ name: z.string() })).optional(),
    });
    const page = lessonOverallFields.outputSchema(row).parse({
      data: [
        {
          class: "Math 101",
          unit: "Intro",
          courseCentre: [{ name: "East" }],
        },
      ],
    });
    assert.deepEqual(page.data, [
      { class: "Math 101", unit: "Intro", centre: [{ name: "East" }] },
    ]);
  });
});

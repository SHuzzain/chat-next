import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { z } from "zod";

import { FieldAlias } from "./api-wire";

/** Mirrors enrollFields — keep in sync with user-schema.ts */
const enrollFields = new FieldAlias({
  centre: "courseCentre",
  "centre.name": "courseCentre.name",
  "centre._id": "courseCentre._id",
  "centre.code": "courseCentre.code",
  enrolledClassesCount: "assignedCourses",
  completedClassesCount: "completedCourses",
  userRoleTypes: "type",
  userStatus: "status",
});

/** Mirrors classScoreFields — keep in sync with user-schema.ts */
const classScoreFields = new FieldAlias({
  class: "course",
  "class.name": "course.name",
  "class.code": "course.code",
  "class._id": "course._id",
  centre: "courseCentre",
  "centre.name": "courseCentre.name",
  "centre._id": "courseCentre._id",
  "centre.code": "courseCentre.code",
  "user.centre": "user.courseCentre",
});

/** Mirrors classUsersFields — keep in sync with class-users.schema.ts */
const classUsersFields = new FieldAlias({
  class: "course",
  "class.name": "course.name",
  "class.code": "course.code",
  "class._id": "course._id",
  "class.status": "course.status",
  "class.centre": "course.courseCentre",
  userCentre: "userCourseCentres",
  "userCentre.name": "userCourseCentres.name",
  "userCentre._id": "userCourseCentres._id",
  "userCentre.code": "userCourseCentres.code",
  centre: "courseCentre",
  "centre.name": "courseCentre.name",
  "centre._id": "courseCentre._id",
  "centre.code": "courseCentre.code",
  "user.centre": "user.courseCentre",
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
});

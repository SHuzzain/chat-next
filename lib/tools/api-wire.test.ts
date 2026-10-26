import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { fromWireResponse, toApiField, toWireRequest } from "./api-wire";

/** Mirrors reportUserEnrollSchema.fieldAliases */
const enrollAliases = {
  centre: "courseCentre",
  "centre.name": "courseCentre.name",
  "centre._id": "courseCentre._id",
  "centre.code": "courseCentre.code",
} as const;

/** Mirrors reportUserClassScoreSchema.fieldAliases (course = Class here) */
const classScoreAliases = {
  class: "course",
  "class.name": "course.name",
  centre: "courseCentre",
  "centre.name": "courseCentre.name",
  "user.centre": "user.courseCentre",
} as const;

describe("toWireRequest", () => {
  it("maps query ids and filter/select paths in one call", () => {
    assert.deepEqual(
      toWireRequest({
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
        fieldAliases: enrollAliases,
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

  it("preserves filter type and value", () => {
    const { body } = toWireRequest({
      body: {
        advanceFilter: [
          { field: "fullName", type: "Contains", value: ["Ada"] },
        ],
      },
      fieldAliases: enrollAliases,
    });
    assert.deepEqual(body.advanceFilter, [
      { field: "fullName", type: "Contains", value: ["Ada"] },
    ]);
  });

  it("maps class paths when endpoint treats course as Class", () => {
    assert.equal(toApiField("class.name", classScoreAliases), "course.name");
    const { body } = toWireRequest({
      body: {
        advanceFilterSelect: ["class", "centre.name", "user.centre"],
      },
      fieldAliases: classScoreAliases,
    });
    assert.deepEqual(body.advanceFilterSelect, [
      "course",
      "courseCentre.name",
      "user.courseCentre",
    ]);
  });

  it("omits empty id values and supports idMap override", () => {
    assert.deepEqual(
      toWireRequest({
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

describe("fromWireResponse", () => {
  it("renames LMS keys to agent names", () => {
    assert.deepEqual(
      fromWireResponse(
        {
          data: [
            {
              _id: "aaaaaaaaaaaaaaaaaaaaaaaa",
              fullName: "Ada",
              courseCentre: [{ _id: "bbbbbbbbbbbbbbbbbbbbbbbb", name: "East" }],
            },
          ],
          totalItems: 1,
        },
        enrollAliases,
      ),
      {
        data: [
          {
            _id: "aaaaaaaaaaaaaaaaaaaaaaaa",
            fullName: "Ada",
            centre: [{ _id: "bbbbbbbbbbbbbbbbbbbbbbbb", name: "East" }],
          },
        ],
        totalItems: 1,
      },
    );
  });

  it("does not rename course→class when aliases omit that mapping", () => {
    assert.deepEqual(
      fromWireResponse(
        { data: [{ course: { name: "Parent Course Template" } }] },
        enrollAliases,
      ),
      { data: [{ course: { name: "Parent Course Template" } }] },
    );
  });

  it("renames course→class when endpoint aliases include it", () => {
    assert.deepEqual(
      fromWireResponse(
        {
          data: [
            {
              course: { name: "Math 101" },
              courseCentre: [{ name: "East" }],
            },
          ],
        },
        classScoreAliases,
      ),
      {
        data: [
          {
            class: { name: "Math 101" },
            centre: [{ name: "East" }],
          },
        ],
      },
    );
  });
});

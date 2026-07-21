import { describe, expect, it } from "vitest";

import { normalizeProjectFields } from "../normalize-project-fields";

describe("normalizeProjectFields", () => {
  it("drops parent when a nested child exists", () => {
    expect(normalizeProjectFields(["course", "course.name"])).toEqual([
      "course.name",
    ]);
  });

  it("keeps unrelated siblings", () => {
    expect(
      normalizeProjectFields(["course.name", "status", "progress"]),
    ).toEqual(["course.name", "status", "progress"]);
  });

  it("dedupes and trims", () => {
    expect(
      normalizeProjectFields([" course.name ", "course.name", ""]),
    ).toEqual(["course.name"]);
  });

  it("keeps parent when no children", () => {
    expect(normalizeProjectFields(["course", "status"])).toEqual([
      "course",
      "status",
    ]);
  });
});

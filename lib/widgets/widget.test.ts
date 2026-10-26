import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { z } from "zod";

import { classRowSchema } from "@/features/class/schema/class-list";
import { userInfoRowSchema } from "@/features/user/schema/user-info";

import { chooseWidget, presentList, selectionMessage, toWidgetModelOutput } from "./present";
import { fieldWithRole } from "./roles";

const rowSchema = z.object({
  _id: z.string().meta({ ui: { role: "value" } }),
  name: z.string().meta({ ui: { roles: ["label", "search"] } }),
  code: z
    .string()
    .optional()
    .meta({ ui: { role: "detail" } }),
});

function page(rows: Array<Record<string, unknown>>, totalItems = rows.length) {
  return { data: rows, totalItems, totalPage: 1, currentPage: 1 };
}

const query = { page: 1 };
const body = {
  advanceFilter: [{ field: "name", type: "Contains", value: ["Rubric"] }],
};

describe("widget roles", () => {
  it("reads roles from a row schema", () => {
    assert.equal(fieldWithRole(rowSchema, "label"), "name");
    assert.equal(fieldWithRole(rowSchema, "value"), "_id");
    assert.equal(fieldWithRole(rowSchema, "detail"), "code");
    assert.equal(fieldWithRole(rowSchema, "search"), "name");
  });

  it("reads class and learner display fields", () => {
    assert.equal(fieldWithRole(classRowSchema, "label"), "name");
    assert.equal(fieldWithRole(classRowSchema, "value"), "_id");
    assert.equal(fieldWithRole(classRowSchema, "detail"), "code");
    assert.equal(fieldWithRole(userInfoRowSchema, "label"), "fullName");
    assert.equal(fieldWithRole(userInfoRowSchema, "value"), "_id");
    assert.equal(fieldWithRole(userInfoRowSchema, "detail"), "email");
  });
});

describe("chooseWidget", () => {
  it("picks a control from the count and the question", () => {
    assert.equal(
      chooseWidget({ purpose: "resolve", selection: "single", count: 0, exactCount: 0 }),
      "empty",
    );
    assert.equal(
      chooseWidget({ purpose: "resolve", selection: "single", count: 1, exactCount: 0 }),
      "continue",
    );
    assert.equal(
      chooseWidget({ purpose: "resolve", selection: "single", count: 4, exactCount: 1 }),
      "continue",
    );
    assert.equal(
      chooseWidget({ purpose: "resolve", selection: "single", count: 4, exactCount: 0 }),
      "radio",
    );
    assert.equal(
      chooseWidget({ purpose: "resolve", selection: "multi", count: 4, exactCount: 0 }),
      "checkbox",
    );
    assert.equal(
      chooseWidget({ purpose: "resolve", selection: "single", count: 12, exactCount: 0 }),
      "async-select",
    );
    assert.equal(
      chooseWidget({ purpose: "resolve", selection: "multi", count: 12, exactCount: 0 }),
      "async-multi-select",
    );
    assert.equal(
      chooseWidget({ purpose: "show", selection: "single", count: 12, exactCount: 0 }),
      "data-table",
    );
    assert.equal(
      chooseWidget({ purpose: "show", selection: "single", count: 3, exactCount: 0 }),
      "continue",
    );
  });
});

describe("presentList", () => {
  const base = {
    query,
    body,
    rowSchema,
    source: "classes",
    entity: "Class",
    plural: "Classes",
    purpose: "resolve" as const,
    selection: "single" as const,
  };

  it("builds radio options without sending those rows to the model", () => {
    const ui = presentList({
      ...base,
      page: page([
        { _id: "a", name: "Rubric East", code: "R-1" },
        { _id: "b", name: "Rubric West", code: "R-2" },
        { _id: "c", name: "Rubric North", code: "R-3" },
      ]),
    });
    assert.equal(ui.widget, "radio");
    if (ui.widget !== "radio") return;
    assert.deepEqual(
      ui.options.map((option) => option.label),
      ["Rubric East", "Rubric West", "Rubric North"],
    );
    const model = toWidgetModelOutput({ ui, totalItems: 3, data: [{ secret: true }] });
    assert.equal(model.type, "json");
    assert.equal("rows" in (model.value as object), false);
  });

  it("continues when one row matches the filter exactly", () => {
    const ui = presentList({
      ...base,
      page: page([
        { _id: "a", name: "Rubric", code: "R-1" },
        { _id: "b", name: "Rubric advanced", code: "R-2" },
      ]),
    });
    assert.equal(ui.widget, "continue");
    if (ui.widget !== "continue") return;
    assert.deepEqual(ui.rows, [{ id: "a", label: "Rubric", detail: "R-1" }]);
  });

  it("keeps the query for a long single-select list", () => {
    const rows = Array.from({ length: 8 }, (_, index) => ({
      _id: `id-${index}`,
      name: `Class ${index}`,
    }));
    const ui = presentList({
      ...base,
      page: page(rows, 40),
    });
    assert.equal(ui.widget, "async-select");
    if (ui.widget !== "async-select") return;
    assert.equal(ui.source, "classes");
    assert.equal(ui.totalItems, 40);
    assert.deepEqual(ui.body, body);
  });

  it("uses checkboxes when the question needs several records", () => {
    const ui = presentList({
      ...base,
      selection: "multi",
      body: {},
      page: page([
        { _id: "a", name: "One" },
        { _id: "b", name: "Two" },
      ]),
    });
    assert.equal(ui.widget, "checkbox");
  });
});

describe("selectionMessage", () => {
  it("names the selected record and its id", () => {
    assert.equal(
      selectionMessage("Class", "Classes", [{ id: "abc", label: "Rubric" }]),
      "Selected class: Rubric (_id: abc)",
    );
    assert.equal(
      selectionMessage("Learner", "Learners", [
        { id: "a", label: "Ann" },
        { id: "b", label: "Ben" },
      ]),
      "Selected learners: Ann (_id: a), Ben (_id: b)",
    );
  });
});

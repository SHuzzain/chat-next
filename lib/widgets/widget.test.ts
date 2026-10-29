import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { z } from "zod";

import { classRowSchema } from "@/features/class/schema/class-list";
import { reportUserClassScoreRowSchema } from "@/features/reports/schema/user-schema";
import { userInfoRowSchema } from "@/features/user/schema/user-info";

import { selectionMessage, toWidgetAdvanceFilterOutput } from "./present";
import { fieldWithRole, tableColumns } from "./roles";
import { widgetDataTableParameters } from "./schema/widget-data-table";
import { widgetMultiSelectParameters } from "./schema/widget-multi-select";
import { widgetSearchParameters } from "./schema/widget-search";
import { widgetSelectParameters } from "./schema/widget-select";

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

function widget(overrides: {
  rows: Array<Record<string, unknown>>;
  totalItems?: number;
  purpose?: "resolve" | "show" | "select";
  selection?: "single" | "multi";
}) {
  return toWidgetAdvanceFilterOutput({
    schema: page(overrides.rows, overrides.totalItems),
    config: {
      entity: "Learner",
      source: "users",
      purpose: overrides.purpose ?? "resolve",
      selection: overrides.selection ?? "single",
      rowSchema,
    },
  });
}

function valueOf(result: ReturnType<typeof widget>) {
  return result.value as Record<string, unknown>;
}

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

  it("builds table columns from label, detail, and column roles", () => {
    assert.deepEqual(tableColumns(rowSchema), [
      { key: "name", label: "Name", priority: "primary" },
      { key: "code", label: "Code", priority: "secondary" },
    ]);
    assert.deepEqual(tableColumns(classRowSchema), [
      { key: "name", label: "Name", priority: "primary" },
      { key: "code", label: "Code", priority: "secondary" },
    ]);
  });

  it("labels user-class-score rows by class name, not learner name", () => {
    assert.equal(fieldWithRole(reportUserClassScoreRowSchema, "label"), "class.name");
    assert.equal(fieldWithRole(reportUserClassScoreRowSchema, "detail"), "class.code");
    assert.deepEqual(tableColumns(reportUserClassScoreRowSchema), [
      { key: "class.name", label: "Name", priority: "primary" },
      { key: "class.code", label: "Code", priority: "secondary" },
      { key: "progress", label: "Progress %", priority: "secondary" },
      { key: "score", label: "Score %", priority: "secondary" },
      { key: "status", label: "Status", priority: "secondary" },
    ]);
  });
});

describe("toWidgetAdvanceFilterOutput", () => {
  it("asks for a different search when nothing matches", () => {
    const value = valueOf(widget({ rows: [], totalItems: 0 }));
    assert.equal(value.nextTool, undefined);
    assert.equal(value.totalItems, 0);
    assert.equal(value.source, "users");
    assert.match(String(value.instruction), /different or more specific search/);
  });

  it("returns the one matching record", () => {
    const value = valueOf(
      widget({
        rows: [{ _id: "a", name: "Ada", code: "A-1" }],
      }),
    );
    assert.equal(value.nextTool, undefined);
    assert.equal(value.totalItems, 1);
    assert.deepEqual(value.record, {
      id: "a",
      label: "Ada",
      detail: "A-1",
      row: { _id: "a", name: "Ada", code: "A-1" },
    });
  });

  it("asks the agent to call widget_select for one choice among 2 to 12 rows", () => {
    const value = valueOf(
      widget({
        selection: "single",
        rows: [
          { _id: "a", name: "Ada", code: "A-1" },
          { _id: "b", name: "Ben", code: "B-1" },
        ],
      }),
    );
    assert.equal(value.nextTool, "widget_select");
    assert.match(String(value.instruction), /Call widget_select/);
    assert.deepEqual(widgetSelectParameters.parse(value.arguments).options, [
      { id: "a", label: "Ada", detail: "A-1" },
      { id: "b", label: "Ben", detail: "B-1" },
    ]);
  });

  it("asks the agent to call widget_multi_select for several choices", () => {
    const value = valueOf(
      widget({
        selection: "multi",
        rows: [
          { _id: "a", name: "Ada" },
          { _id: "b", name: "Ben" },
        ],
      }),
    );
    assert.equal(value.nextTool, "widget_multi_select");
    const args = widgetMultiSelectParameters.parse(value.arguments);
    assert.equal(args.options.length, 2);
    assert.equal(args.entity, "Learner");
  });

  it("asks the agent to call widget_data_table when the user asked to show the list", () => {
    const rows = Array.from({ length: 13 }, (_, index) => ({
      _id: `id-${index}`,
      name: `User ${index}`,
    }));
    const value = valueOf(
      toWidgetAdvanceFilterOutput({
        schema: page(rows, 13),
        config: {
          entity: "Learner",
          source: "users",
          purpose: "show",
          selection: "single",
          rowSchema,
          query: { page: 1, rowPerPage: 12 },
          body: {
            advanceFilterSelect: ["_id", "fullName", "email"],
          },
        },
      }),
    );
    assert.equal(value.nextTool, "widget_data_table");
    assert.match(String(value.instruction), /Call widget_data_table/);
    const args = widgetDataTableParameters.parse(value.arguments);
    assert.equal(args.totalItems, 13);
    assert.equal(args.currentPage, 1);
    assert.equal(args.totalPage, 1);
    assert.deepEqual(args.columns, [
      { key: "name", label: "Name", priority: "primary" },
      { key: "code", label: "Code", priority: "secondary" },
    ]);
    assert.deepEqual(
      args.data,
      rows.map((row) => ({ _id: row._id, name: row.name })),
    );
    assert.deepEqual(args.query, { page: 1, rowPerPage: 12 });
    assert.deepEqual(args.body, {
      advanceFilterSelect: ["_id", "fullName", "email"],
    });
  });

  it("keeps nested label paths intact for roster tables", () => {
    const rosterSchema = z.object({
      _id: z.string().meta({ ui: { role: "value" } }),
      user: z.object({
        fullName: z.string().meta({ ui: { roles: ["label", "search"] } }),
        email: z.string().optional().meta({ ui: { role: "column" } }),
      }),
      score: z.number().optional().meta({ ui: { role: "column" } }),
    });
    const value = valueOf(
      toWidgetAdvanceFilterOutput({
        schema: {
          data: [
            {
              _id: "enroll-1",
              user: { fullName: "checking user demo", email: "a@b.com" },
              score: 80,
            },
          ],
          totalItems: 1,
          totalPage: 1,
          currentPage: 1,
        },
        config: {
          entity: "Learner",
          source: "class-users-report",
          purpose: "show",
          selection: "single",
          rowSchema: rosterSchema,
        },
      }),
    );
    assert.equal(value.nextTool, "widget_data_table");
    const args = widgetDataTableParameters.parse(value.arguments);
    assert.deepEqual(args.columns, [
      { key: "user.fullName", label: "Full Name", priority: "primary" },
      { key: "user.email", label: "Email", priority: "secondary" },
      { key: "score", label: "Score", priority: "secondary" },
    ]);
    assert.deepEqual(args.data, [
      {
        _id: "enroll-1",
        user: { fullName: "checking user demo", email: "a@b.com" },
        score: 80,
      },
    ]);
  });

  it("asks the agent to call widget_search when more than 12 matches need resolving", () => {
    const rows = Array.from({ length: 13 }, (_, index) => ({
      _id: `id-${index}`,
      name: `User ${index}`,
    }));
    const value = valueOf(widget({ rows, totalItems: 13, purpose: "resolve" }));
    assert.equal(value.nextTool, "widget_search");
    assert.match(String(value.instruction), /narrow the search/);
    const args = widgetSearchParameters.parse(value.arguments);
    assert.equal(args.source, "users");
    assert.equal(args.totalItems, 13);
    assert.equal(args.selection, "single");

    const multi = valueOf(widget({ rows, totalItems: 13, purpose: "resolve", selection: "multi" }));
    assert.equal(widgetSearchParameters.parse(multi.arguments).selection, "multi");
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

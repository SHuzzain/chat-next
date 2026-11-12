import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  formSubmissionMessage,
  widgetFormParameters,
} from "./widget-form";

describe("widgetFormParameters", () => {
  it("accepts a valid multi-field form", () => {
    const parsed = widgetFormParameters.parse({
      title: "Report filters",
      description: "Narrow the report before loading it.",
      submitLabel: "Apply",
      fields: [
        {
          name: "status",
          type: "select",
          label: "Status",
          placeholder: "Choose status",
          required: true,
          options: [
            { value: "ACTIVE", label: "Active" },
            { value: "INACTIVE", label: "Inactive" },
          ],
        },
        {
          name: "notes",
          type: "textarea",
          label: "Notes",
          description: "Optional context for this request",
          example: "Only East Campus learners",
        },
        {
          name: "includeArchived",
          type: "checkbox",
          label: "Include archived",
          defaultValue: false,
        },
      ],
    });
    assert.equal(parsed.fields.length, 3);
  });

  it("rejects fields without a label or name", () => {
    assert.throws(() =>
      widgetFormParameters.parse({
        title: "Broken",
        fields: [{ type: "text", name: "x" }],
      }),
    );
    assert.throws(() =>
      widgetFormParameters.parse({
        title: "Broken",
        fields: [{ type: "text", label: "Name" }],
      }),
    );
  });

  it("requires options for select, radio, and checkbox_group", () => {
    assert.throws(() =>
      widgetFormParameters.parse({
        title: "Broken",
        fields: [{ name: "status", type: "select", label: "Status" }],
      }),
    );
    assert.throws(() =>
      widgetFormParameters.parse({
        title: "Broken",
        fields: [
          { name: "mode", type: "radio", label: "Mode", options: [] },
        ],
      }),
    );
    assert.throws(() =>
      widgetFormParameters.parse({
        title: "Broken",
        fields: [
          { name: "tags", type: "checkbox_group", label: "Tags" },
        ],
      }),
    );
  });
});

describe("formSubmissionMessage", () => {
  it("formats a readable summary and JSON block", () => {
    const message = formSubmissionMessage("Report filters", {
      status: "ACTIVE",
      tags: ["a", "b"],
      includeArchived: false,
    });
    assert.match(message, /Submitted form "Report filters":/);
    assert.match(message, /- status: ACTIVE/);
    assert.match(message, /- tags: a, b/);
    assert.match(message, /- includeArchived: false/);
    assert.match(message, /```json/);
    assert.match(message, /"status": "ACTIVE"/);
  });

  it("redacts password fields in the message", () => {
    const message = formSubmissionMessage("Credentials", {
      email: "ada@example.com",
      password: "Complex1!",
      passwordSecretId: "opaque-id",
    });
    assert.match(message, /- password: \[set\]/);
    assert.match(message, /"password": "\[set\]"/);
    assert.doesNotMatch(message, /Complex1!/);
    assert.match(message, /passwordSecretId/);
  });

  it("accepts password field type", () => {
    const parsed = widgetFormParameters.parse({
      title: "Credentials",
      fields: [
        { name: "email", type: "email", label: "Email", required: true },
        { name: "password", type: "password", label: "Password", required: true },
      ],
    });
    assert.equal(parsed.fields[1]?.type, "password");
  });
});

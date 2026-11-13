import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  formSubmissionMessage,
  widgetFormParameters,
} from "@/lib/widgets/schema/widget-form";

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
  it("formats a readable summary without a JSON dump", () => {
    const message = formSubmissionMessage("Report filters", {
      status: "ACTIVE",
      tags: ["a", "b"],
      includeArchived: false,
    });
    assert.match(message, /Submitted form "Report filters":/);
    assert.match(message, /- status: ACTIVE/);
    assert.match(message, /- tags: a, b/);
    assert.match(message, /- includeArchived: false/);
    assert.doesNotMatch(message, /```json/);
  });

  it("redacts password fields and keeps secret ids off the field list", () => {
    const message = formSubmissionMessage("Credentials", {
      email: "ada@example.com",
      password: "Complex1!",
      passwordSecretId: "opaque-id",
    });
    assert.match(message, /- password: \[set\]/);
    assert.match(message, /- email: ada@example.com/);
    assert.doesNotMatch(message, /Complex1!/);
    assert.doesNotMatch(message, /- passwordSecretId/);
    assert.match(message, /^passwordSecretId: opaque-id$/m);
    assert.doesNotMatch(message, /```json/);
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

  it("accepts optional file field and keeps avatarSecretId", () => {
    const parsed = widgetFormParameters.parse({
      title: "Profile photo",
      fields: [
        {
          name: "avatar",
          type: "file",
          label: "Profile photo",
          description: "Optional jpg/png up to 5MB",
        },
      ],
    });
    assert.equal(parsed.fields[0]?.type, "file");

    const message = formSubmissionMessage("Profile photo", {
      avatar: "ada.png",
      avatarSecretId: "opaque-avatar-id",
      avatarBase64: "SHOULD_NOT_LEAK",
    });
    assert.match(message, /avatarSecretId/);
    assert.match(message, /opaque-avatar-id/);
    assert.match(message, /- avatar: ada\.png/);
    assert.doesNotMatch(message, /SHOULD_NOT_LEAK/);
  });
});

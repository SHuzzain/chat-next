import { describe, expect, it } from "vitest";
import { z } from "zod";

import { WIDGET_RESOURCES } from "@/mcptools/widget-resources";
import {
  parseDynamicWidget,
  renderWidgetToolInputSchema,
  widgetDataRequestSchema,
} from "../schemas";

describe("widget resources", () => {
  it("exposes httpExecute-compatible fields from domains", () => {
    expect(WIDGET_RESOURCES.users.endpoint).toBe("/users/get-users");
    expect(WIDGET_RESOURCES.user_course_progress.pathParams).toContain(
      "userId",
    );
    expect(WIDGET_RESOURCES.users.queryParams).toContain("page");
    expect(WIDGET_RESOURCES.users.bodyParams).toContain("advanceFilter");
  });
});

describe("widget schemas", () => {
  it("accepts async-select remote config", () => {
    const parsed = parseDynamicWidget({
      id: "pick-user",
      type: "async-select",
      title: "Pick a user",
      dataSource: {
        source: "remote",
        resource: "users",
        params: {},
      },
    });
    expect(parsed.type).toBe("async-select");
  });

  it("rejects absolute URL style resources", () => {
    expect(() =>
      parseDynamicWidget({
        id: "bad",
        type: "async-select",
        title: "Bad",
        dataSource: {
          source: "remote",
          resource: "https://evil.example/api",
          params: {},
        },
      }),
    ).toThrow();
  });

  it("exposes a root object tool schema (OpenAI-compatible)", () => {
    const json = z.toJSONSchema(renderWidgetToolInputSchema) as {
      type?: string;
    };
    expect(json.type).toBe("object");
  });

  it("parses widget-data request without absolute urls", () => {
    const parsed = widgetDataRequestSchema.parse({
      resource: "users",
      pagination: { page: 1, pageSize: 10 },
      search: "sahin",
    });
    expect(parsed.resource).toBe("users");
  });
});

"use generative";
import { defineToolkit, humanTool } from "@assistant-ui/react";
import z from "zod";

export const RENDER_WIDGET_TOOL_NAME = "render_widget";

/** @deprecated Use render_widget */
export const ASK_USER_CHOICE_TOOL_NAME = RENDER_WIDGET_TOOL_NAME;

const httpMethodSchema = z.enum(["GET", "POST"]);

const endpointSchema = z
  .object({
    endpoint: z
      .string()
      .min(1)
      .describe(
        "API endpoint used to load selectable options. Example: /users/get-users.",
      ),

    method: httpMethodSchema.describe("HTTP method used when loading options."),

    pathParams: z
      .array(z.string())
      .default([])
      .describe(
        "Argument names that must be inserted into endpoint path placeholders.",
      ),

    queryParams: z
      .array(z.string())
      .default([])
      .describe("Argument names sent as URL query parameters."),

    bodyParams: z
      .array(z.string())
      .default([])
      .describe("Argument names sent inside the request body."),
  })
  .strict();

const asyncSelectDataSourceSchema = z
  .object({
    endpointDetails: endpointSchema,

    valueField: z
      .string()
      .default("_id")
      .describe(
        "Field from each API result used as the selected option value.",
      ),

    labelField: z
      .string()
      .default("fullName")
      .describe(
        "Field from each API result displayed as the primary option label.",
      ),

    descriptionField: z
      .string()
      .optional()
      .describe(
        "Optional field displayed as secondary text, such as email or code.",
      ),

    responseDataPath: z
      .string()
      .optional()
      .describe(
        "Dot-path containing the result array. Example: data.rows or data.",
      ),

    staticParams: z
      .record(z.string(), z.unknown())
      .optional()
      .describe("Fixed parameters always included when calling the endpoint."),
  })
  .strict();

export function createInteractiveHumanTools() {
  return defineToolkit({
    async_select: {
      description: "Select an option from a list of options",
      execute: humanTool(),
      parameters: z.object({
        title: z
          .string()
          .min(1)
          .describe("Title displayed above the select component."),

        description: z
          .string()
          .optional()
          .describe("Additional instructions displayed to the user."),

        placeholder: z
          .string()
          .default("Search and select an option")
          .describe("Placeholder displayed inside the input."),

        searchPlaceholder: z
          .string()
          .optional()
          .describe("Placeholder displayed while searching."),

        initialSearch: z
          .string()
          .optional()
          .describe("Initial search text used when the widget first loads."),

        searchable: z
          .boolean()
          .default(true)
          .describe("Whether the user can search for options."),

        required: z
          .boolean()
          .default(true)
          .describe("Whether the user must select an option."),

        searchParam: z
          .string()
          .default("textSearch")
          .describe("Parameter name used to send the user's search text."),

        dataSource: asyncSelectDataSourceSchema,
      }),
    },
  });
}

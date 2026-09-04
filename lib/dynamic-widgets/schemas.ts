import { z } from "zod";

import { RESOURCE_NAMES, type ResourceName } from "@/mcptools/widget-resources";

export { RESOURCE_NAMES, type ResourceName };

export const staticOptionSchema = z.object({
  value: z.string(),
  label: z.string(),
  description: z.string().optional(),
  disabled: z.boolean().optional(),
});

export const staticDataSourceSchema = z.object({
  source: z.literal("static"),
  options: z.array(staticOptionSchema).max(50),
});

export const remoteDataSourceSchema = z.object({
  source: z.literal("remote"),

  endpoint: z
    .string()
    .describe("The API endpoint used to retrieve the remote data."),

  method: z
    .enum(["GET", "POST"])
    .describe("The HTTP method required by the endpoint."),

  pathParams: z
    .record(z.string(), z.string())
    .optional()
    .describe(
      "Values for path parameters defined in the endpoint. Include only parameters that appear in the endpoint path. For example, if the endpoint is '/report/:userId', provide { userId: '...' }. Do not invent or include additional path parameters.",
    ),

  queryParams: z
    .record(
      z.string(),
      z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]),
    )
    .optional()
    .describe(
      "Query parameter values. Choose only supported parameter names and provide values only when they help satisfy the user's request. Do not include unsupported or unnecessary parameters.",
    ),

  body: z
    .record(z.string(), z.unknown())
    .optional()
    .describe(
      "Request body values. Include only supported fields that are relevant to the current operation. Do not invent fields.",
    ),
});

export const dataSourceSchema = z.discriminatedUnion("source", [
  staticDataSourceSchema,
  remoteDataSourceSchema,
]);

export const optionMappingSchema = z.object({
  value: z
    .string()
    .describe(
      "The canonical value associated with this option. Think about what information the next step in the workflow is most likely to require, and store that value here.",
    ),
  // .describe(
  //   "The actual value that should be returned when the user selects this option. Choose the value that is most appropriate for subsequent tool calls (for example, an ID, email, username, code, slug, or other unique identifier). This value is for the workflow and is not necessarily shown to the user.",
  // ),

  label: z
    .string()
    .describe("The primary text displayed to the user for this option."),

  description: z
    .string()
    .optional()
    .describe(
      "Optional secondary text that provides additional context to help the user distinguish between similar options.",
    ),
});

export const dependsOnSchema = z.object({
  widgetId: z.string(),
  paramName: z.string(),
});

// widget base schema and components
export const widgetBaseSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  submitLabel: z.string().optional(),
  cancelLabel: z.string().optional(),
  dependsOn: dependsOnSchema.optional(),
});

export const asyncSelectWidgetSchema = widgetBaseSchema.extend({
  type: z.literal("async-select"),
  placeholder: z.string().optional(),
  searchable: z.boolean().default(true),
  required: z.boolean().default(true),
  dataSource: dataSourceSchema,
  getOptionKey: z.function(),
  optionMapping: optionMappingSchema.optional(),
});

export const asyncMultiSelectWidgetSchema = widgetBaseSchema.extend({
  type: z.literal("async-multi-select"),
  placeholder: z.string().optional(),
  searchable: z.boolean().default(true),
  required: z.boolean().default(true),
  minSelect: z.number().int().min(0).optional(),
  maxSelect: z.number().int().min(1).max(50).optional(),
  dataSource: dataSourceSchema,
  optionMapping: optionMappingSchema.optional(),
});

export const radioGroupWidgetSchema = widgetBaseSchema.extend({
  type: z.literal("radio-group"),
  required: z.boolean().default(true),
  dataSource: dataSourceSchema,
  optionMapping: optionMappingSchema.optional(),
});

export const checkboxGroupWidgetSchema = widgetBaseSchema.extend({
  type: z.literal("checkbox-group"),
  required: z.boolean().default(true),
  minSelect: z.number().int().min(0).optional(),
  maxSelect: z.number().int().min(1).max(50).optional(),
  dataSource: dataSourceSchema,
  optionMapping: optionMappingSchema.optional(),
});

export const tableColumnSchema = z.object({
  key: z.string(),
  label: z.string(),
  sortable: z.boolean().optional(),
  format: z.enum(["text", "percentage", "date", "number"]).optional(),
});

export const asyncTableWidgetSchema = widgetBaseSchema
  .omit({ submitLabel: true, cancelLabel: true })
  .extend({
    type: z.literal("async-table"),
    dataSource: remoteDataSourceSchema,
    select: z.array(z.string()).max(40).optional(),
    columns: z.array(tableColumnSchema).min(1),
    pagination: z
      .object({
        pageSize: z.number().int().min(1).max(50).default(20),
      })
      .optional(),
    searchable: z.boolean().default(true),
    exportable: z.boolean().default(false),
    selectionMode: z.enum(["none", "single", "multi"]).default("none"),
  });

export const confirmationWidgetSchema = widgetBaseSchema.extend({
  type: z.literal("confirmation"),
  message: z.string().min(1),
  confirmValue: z.record(z.string(), z.unknown()).optional(),
});

export const optionCardsWidgetSchema = widgetBaseSchema.extend({
  type: z.literal("option-cards"),
  required: z.boolean().default(true),
  dataSource: dataSourceSchema,
  optionMapping: optionMappingSchema.optional(),
});

export const datePickerWidgetSchema = widgetBaseSchema.extend({
  type: z.literal("date-picker"),
  required: z.boolean().default(true),
  placeholder: z.string().optional(),
  minDate: z.string().optional(),
  maxDate: z.string().optional(),
});

export const dateRangeWidgetSchema = widgetBaseSchema.extend({
  type: z.literal("date-range"),
  required: z.boolean().default(true),
  startPlaceholder: z.string().optional(),
  endPlaceholder: z.string().optional(),
});

export const formFieldTypeSchema = z.enum([
  "text",
  "textarea",
  "number",
  "select",
  "multi-select",
  "radio",
  "checkbox",
  "date",
  "date-range",
]);

export const formFieldSchema = z.object({
  name: z.string().min(1),
  label: z.string().min(1),
  type: formFieldTypeSchema,
  description: z.string().optional(),
  placeholder: z.string().optional(),
  required: z.boolean().default(false),
  defaultValue: z.unknown().optional(),
  dataSource: dataSourceSchema.optional(),
  optionMapping: optionMappingSchema.optional(),
  dependsOn: dependsOnSchema.optional(),
});

export const dynamicFormWidgetSchema = widgetBaseSchema.extend({
  type: z.literal("dynamic-form"),
  fields: z.array(formFieldSchema).min(1).max(30),
});

export const dynamicWidgetSchema = z.discriminatedUnion("type", [
  asyncSelectWidgetSchema,
  asyncMultiSelectWidgetSchema,
  radioGroupWidgetSchema,
  checkboxGroupWidgetSchema,
  asyncTableWidgetSchema,
  confirmationWidgetSchema,
  optionCardsWidgetSchema,
  datePickerWidgetSchema,
  dateRangeWidgetSchema,
  dynamicFormWidgetSchema,
]);

export type DynamicWidget = z.infer<typeof dynamicWidgetSchema>;
export type StaticOption = z.infer<typeof staticOptionSchema>;
export type DataSource = z.infer<typeof dataSourceSchema>;
export type OptionMapping = z.infer<typeof optionMappingSchema>;
export type FormField = z.infer<typeof formFieldSchema>;

export const WIDGET_TYPES = [
  "async-select",
  "async-multi-select",
  "radio-group",
  "checkbox-group",
  "async-table",
  "confirmation",
  "option-cards",
  "date-picker",
  "date-range",
  "dynamic-form",
] as const;

/**
 * OpenAI / Responses API require tool `parameters` to be a root JSON Schema
 * `type: "object"`. Zod discriminated unions serialize as oneOf (type None)
 * and are rejected. Use this flat object for the tool; validate with
 * `dynamicWidgetSchema` in execute / Tool UI.
 */

export const renderWidgetResultSchema = z.object({
  kind: z.literal("dynamic-widget"),
  widget: dynamicWidgetSchema,
});

export type RenderWidgetResult = z.infer<typeof renderWidgetResultSchema>;

export const widgetSubmissionSchema = z.object({
  widgetId: z.string(),
  action: z.enum(["submit", "cancel"]),
  value: z.unknown().optional(),
  nextToolHint: z.string().optional(),
});

export type WidgetSubmission = z.infer<typeof widgetSubmissionSchema>;

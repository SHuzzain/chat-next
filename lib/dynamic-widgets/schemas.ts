import { z } from "zod";

import {
  RESOURCE_NAMES,
  type ResourceName,
} from "@/mcptools/widget-resources";

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
  resource: z.enum(RESOURCE_NAMES),
  params: z
    .record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]))
    .default({}),
  pathParams: z.record(z.string(), z.string()).optional(),
});

export const dataSourceSchema = z.discriminatedUnion("source", [
  staticDataSourceSchema,
  remoteDataSourceSchema,
]);

export const optionMappingSchema = z.object({
  value: z.string().default("_id"),
  label: z.string().default("fullName"),
  description: z.string().optional(),
});

export const dependsOnSchema = z.object({
  widgetId: z.string(),
  paramName: z.string(),
});

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

export const asyncTableWidgetSchema = widgetBaseSchema.extend({
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
export const renderWidgetToolInputSchema = z.object({
  id: z.string().min(1).describe("Stable widget id for dependsOn / results"),
  type: z.enum(WIDGET_TYPES).describe("Which trusted widget to render"),
  title: z.string().min(1),
  description: z.string().optional(),
  submitLabel: z.string().optional(),
  cancelLabel: z.string().optional(),
  dependsOn: dependsOnSchema.optional(),
  placeholder: z.string().optional(),
  searchable: z.boolean().optional(),
  required: z.boolean().optional(),
  minSelect: z.number().int().min(0).optional(),
  maxSelect: z.number().int().min(1).max(50).optional(),
  // Flat dataSource (avoid nested discriminatedUnion → oneOf)
  dataSource: z
    .object({
      source: z.enum(["static", "remote"]),
      options: z.array(staticOptionSchema).max(50).optional(),
      resource: z.enum(RESOURCE_NAMES).optional(),
      params: z
        .record(
          z.string(),
          z.union([
            z.string(),
            z.number(),
            z.boolean(),
            z.array(z.string()),
          ]),
        )
        .optional(),
      pathParams: z.record(z.string(), z.string()).optional(),
    })
    .optional(),
  optionMapping: optionMappingSchema.optional(),
  select: z.array(z.string()).max(40).optional(),
  columns: z.array(tableColumnSchema).optional(),
  pagination: z
    .object({
      pageSize: z.number().int().min(1).max(50).optional(),
    })
    .optional(),
  exportable: z.boolean().optional(),
  selectionMode: z.enum(["none", "single", "multi"]).optional(),
  message: z.string().optional(),
  confirmValue: z.record(z.string(), z.unknown()).optional(),
  minDate: z.string().optional(),
  maxDate: z.string().optional(),
  startPlaceholder: z.string().optional(),
  endPlaceholder: z.string().optional(),
  // Avoid nested dataSource discriminatedUnion inside fields
  fields: z
    .array(
      z.object({
        name: z.string().min(1),
        label: z.string().min(1),
        type: formFieldTypeSchema,
        description: z.string().optional(),
        placeholder: z.string().optional(),
        required: z.boolean().optional(),
        defaultValue: z.unknown().optional(),
        dataSource: z
          .object({
            source: z.enum(["static", "remote"]),
            options: z.array(staticOptionSchema).max(50).optional(),
            resource: z.enum(RESOURCE_NAMES).optional(),
            params: z
              .record(
                z.string(),
                z.union([
                  z.string(),
                  z.number(),
                  z.boolean(),
                  z.array(z.string()),
                ]),
              )
              .optional(),
            pathParams: z.record(z.string(), z.string()).optional(),
          })
          .optional(),
        optionMapping: optionMappingSchema.optional(),
        dependsOn: dependsOnSchema.optional(),
      }),
    )
    .max(30)
    .optional(),
});

export type RenderWidgetToolInput = z.infer<typeof renderWidgetToolInputSchema>;

/** Normalize tool args into a DynamicWidget (fills defaults, checks variants). */
export function parseDynamicWidget(input: unknown): DynamicWidget {
  const loose = renderWidgetToolInputSchema.parse(input);
  const { type, dataSource, fields, ...rest } = loose;

  const normalizedDataSource =
    dataSource == null
      ? undefined
      : dataSource.source === "static"
        ? {
            source: "static" as const,
            options: dataSource.options ?? [],
          }
        : {
            source: "remote" as const,
            resource: dataSource.resource ?? "users",
            params: dataSource.params ?? {},
            pathParams: dataSource.pathParams,
          };

  const normalizedFields = fields?.map((field) => {
    const ds = field.dataSource;
    return {
      ...field,
      required: field.required ?? false,
      dataSource:
        ds == null
          ? undefined
          : ds.source === "static"
            ? {
                source: "static" as const,
                options: ds.options ?? [],
              }
            : {
                source: "remote" as const,
                resource: ds.resource ?? "users",
                params: ds.params ?? {},
                pathParams: ds.pathParams,
              },
    };
  });

  return dynamicWidgetSchema.parse({
    ...rest,
    type,
    searchable: loose.searchable ?? true,
    required: loose.required ?? true,
    exportable: loose.exportable ?? false,
    selectionMode: loose.selectionMode ?? "none",
    dataSource: normalizedDataSource,
    fields: normalizedFields,
  });
}

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

export const widgetDataRequestSchema = z.object({
  resource: z.enum(RESOURCE_NAMES),
  origin: z.string().optional(),
  pathParams: z.record(z.string(), z.string()).optional(),
  params: z.record(z.string(), z.unknown()).optional(),
  body: z.record(z.string(), z.unknown()).optional(),
  select: z.array(z.string()).optional(),
  pagination: z
    .object({
      page: z.number().int().min(1).default(1),
      pageSize: z.number().int().min(1).max(50).default(20),
    })
    .optional(),
  search: z.string().optional(),
  sort: z
    .object({
      field: z.string(),
      direction: z.enum(["asc", "desc"]),
    })
    .optional(),
});

export type WidgetDataRequest = z.infer<typeof widgetDataRequestSchema>;

export const widgetDataResponseSchema = z.object({
  data: z.array(z.unknown()),
  pagination: z.object({
    page: z.number(),
    pageSize: z.number(),
    totalItems: z.number(),
    totalPages: z.number(),
    hasNextPage: z.boolean(),
    hasPreviousPage: z.boolean(),
  }),
});

export type WidgetDataResponse = z.infer<typeof widgetDataResponseSchema>;

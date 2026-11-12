import { z } from "zod";

export const widgetFormFieldTypes = [
  "text",
  "textarea",
  "number",
  "email",
  "password",
  "select",
  "radio",
  "checkbox",
  "checkbox_group",
] as const;

const SENSITIVE_KEY = /password/i;

export function isSensitiveFormKey(key: string): boolean {
  return SENSITIVE_KEY.test(key);
}

export type WidgetFormFieldType = (typeof widgetFormFieldTypes)[number];

const optionSchema = z.object({
  value: z.string().min(1).describe("Stable option value"),
  label: z.string().min(1).describe("Label shown for the option"),
  description: z
    .string()
    .optional()
    .describe("Optional secondary line under the option label"),
});

const fieldBaseSchema = z.object({
  name: z
    .string()
    .min(1)
    .describe("Stable key for the submitted value, e.g. status"),
  label: z.string().min(1).describe("Human label shown above the control"),
  description: z
    .string()
    .optional()
    .describe("Helper text under the control"),
  placeholder: z
    .string()
    .optional()
    .describe("Placeholder for text-like controls"),
  example: z
    .string()
    .optional()
    .describe('Short example hint, shown as "e.g. …" when useful'),
  required: z
    .boolean()
    .optional()
    .describe("When true, the user must fill this field before submit"),
});

const optionsFieldTypes = z.enum(["select", "radio", "checkbox_group"]);

const fieldSchema = fieldBaseSchema
  .extend({
    type: z.enum(widgetFormFieldTypes),
    options: z
      .array(optionSchema)
      .min(1)
      .optional()
      .describe("Required for select, radio, and checkbox_group"),
    defaultValue: z
      .union([
        z.string(),
        z.number(),
        z.boolean(),
        z.array(z.string()),
      ])
      .optional()
      .describe("Initial value for the control"),
  })
  .superRefine((field, ctx) => {
    if (optionsFieldTypes.safeParse(field.type).success) {
      if (!field.options || field.options.length === 0) {
        ctx.addIssue({
          code: "custom",
          message: `${field.type} fields require a non-empty options array`,
          path: ["options"],
        });
      }
    }
  });

/** Arguments for {@link widget_form}. */
export const widgetFormParameters = z.object({
  title: z.string().min(1).describe("Form heading shown to the user"),
  description: z
    .string()
    .optional()
    .describe("Short explanation under the heading"),
  submitLabel: z
    .string()
    .optional()
    .describe('Primary button label. Defaults to "Continue"'),
  fields: z
    .array(fieldSchema)
    .min(1)
    .describe("Ordered fields to render. Every field needs a clear label."),
});

export type WidgetFormArgs = z.infer<typeof widgetFormParameters>;
export type WidgetFormField = WidgetFormArgs["fields"][number];

/** Echo of the arguments. The toolkit renders the form. */
export const widgetFormResult = widgetFormParameters;

export type WidgetFormResult = z.infer<typeof widgetFormResult>;

export type WidgetFormValues = Record<
  string,
  string | number | boolean | string[] | undefined
>;

/** Redact sensitive values for chat / model-visible messages. */
export function redactFormValues(
  values: WidgetFormValues,
): WidgetFormValues {
  const next: WidgetFormValues = {};
  for (const [key, value] of Object.entries(values)) {
    next[key] = isSensitiveFormKey(key)
      ? value === undefined || value === ""
        ? "(empty)"
        : "[set]"
      : value;
  }
  return next;
}

/** Build the user message after the form is submitted. Always redacts passwords. */
export function formSubmissionMessage(
  title: string,
  values: WidgetFormValues,
): string {
  const safe = redactFormValues(values);
  const lines = Object.entries(safe).map(([key, value]) => {
    const rendered = Array.isArray(value)
      ? value.join(", ")
      : value === undefined || value === ""
        ? "(empty)"
        : String(value);
    return `- ${key}: ${rendered}`;
  });
  return [
    `Submitted form "${title}":`,
    ...lines,
    "",
    "```json",
    JSON.stringify(safe, null, 2),
    "```",
  ].join("\n");
}

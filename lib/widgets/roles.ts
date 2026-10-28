import { z } from "zod";

export const widgetRoles = ["label", "value", "detail", "search", "column", "metric"] as const;

export type WidgetRole = (typeof widgetRoles)[number];

function isWidgetRole(value: string): value is WidgetRole {
  return (widgetRoles as readonly string[]).includes(value);
}

function rolesFromMeta(schema: z.ZodType): WidgetRole[] {
  const meta = schema.meta();
  const ui = meta?.ui;
  if (!ui || typeof ui !== "object") return [];

  const record = ui as { role?: unknown; roles?: unknown };
  const roles: WidgetRole[] = [];
  if (typeof record.role === "string" && isWidgetRole(record.role)) {
    roles.push(record.role);
  }
  if (Array.isArray(record.roles)) {
    for (const role of record.roles) {
      if (typeof role === "string" && isWidgetRole(role)) roles.push(role);
    }
  }
  return roles;
}

function collectRoles(schema: z.ZodType): WidgetRole[] {
  const roles = rolesFromMeta(schema);
  let current: z.ZodType | undefined = schema;

  while (
    current instanceof z.ZodOptional ||
    current instanceof z.ZodNullable ||
    current instanceof z.ZodDefault
  ) {
    current = current.unwrap() as z.ZodType;
    roles.push(...rolesFromMeta(current));
  }

  return roles;
}

function objectSchema(schema: z.ZodType): z.ZodObject<z.ZodRawShape> | undefined {
  let current = schema;
  while (
    current instanceof z.ZodOptional ||
    current instanceof z.ZodNullable ||
    current instanceof z.ZodDefault
  ) {
    current = current.unwrap() as z.ZodType;
  }
  return current instanceof z.ZodObject ? current : undefined;
}

export function fieldWithRole(rowSchema: z.ZodType, role: WidgetRole): string | undefined {
  const object = objectSchema(rowSchema);
  if (!object) return undefined;

  for (const [key, field] of Object.entries(object.shape)) {
    const child = field as z.ZodType;
    if (collectRoles(child).includes(role)) return key;
    const nested = objectSchema(child);
    if (!nested) continue;
    for (const [nestedKey, nestedField] of Object.entries(nested.shape)) {
      if (collectRoles(nestedField as z.ZodType).includes(role)) {
        return `${key}.${nestedKey}`;
      }
    }
  }
  return undefined;
}

export function fieldsWithRole(rowSchema: z.ZodType, role: WidgetRole): string[] {
  const object = objectSchema(rowSchema);
  if (!object) return [];

  const paths: string[] = [];
  for (const [key, field] of Object.entries(object.shape)) {
    const child = field as z.ZodType;
    if (collectRoles(child).includes(role)) paths.push(key);
    const nested = objectSchema(child);
    if (!nested) continue;
    for (const [nestedKey, nestedField] of Object.entries(nested.shape)) {
      if (collectRoles(nestedField as z.ZodType).includes(role)) {
        paths.push(`${key}.${nestedKey}`);
      }
    }
  }
  return paths;
}

/** Human header for a field path, preferring the Zod field description when set. */
export function fieldLabel(rowSchema: z.ZodType, path: string): string {
  const object = objectSchema(rowSchema);
  if (object) {
    const [head, ...rest] = path.split(".");
    const field = object.shape[head] as z.ZodType | undefined;
    if (field) {
      if (rest.length === 0) {
        const described = field.description?.trim();
        if (described) return described;
      } else {
        const nested = objectSchema(field);
        const leaf = nested?.shape[rest[0]!] as z.ZodType | undefined;
        const described = leaf?.description?.trim();
        if (described) return described;
      }
    }
  }
  const leaf = path.includes(".") ? path.slice(path.lastIndexOf(".") + 1) : path;
  if (leaf === "_id") return "Id";
  const spaced = leaf.replace(/[_]+/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/**
 * Columns for widget_data_table.
 * Always lead with label (+ detail), then any fields marked `column`.
 */
export function tableColumns(
  rowSchema: z.ZodType,
): Array<{ key: string; label: string; priority?: "primary" | "secondary" }> {
  const labelKey = fieldWithRole(rowSchema, "label");
  const detailKey = fieldWithRole(rowSchema, "detail");
  const keys = [
    ...new Set(
      [labelKey, detailKey, ...fieldsWithRole(rowSchema, "column")].filter(
        (key): key is string => Boolean(key),
      ),
    ),
  ];

  return keys.map((key) => ({
    key,
    label: fieldLabel(rowSchema, key),
    ...(key === labelKey ? { priority: "primary" as const } : { priority: "secondary" as const }),
  }));
}

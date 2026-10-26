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
    if (collectRoles(field as z.ZodType).includes(role)) return key;
  }
  return undefined;
}

export function fieldsWithRole(rowSchema: z.ZodType, role: WidgetRole): string[] {
  const object = objectSchema(rowSchema);
  if (!object) return [];

  return Object.entries(object.shape)
    .filter(([, field]) => collectRoles(field as z.ZodType).includes(role))
    .map(([key]) => key);
}

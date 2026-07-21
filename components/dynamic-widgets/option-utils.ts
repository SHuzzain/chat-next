"use client";

import type {
  DataSource,
  OptionMapping,
  StaticOption,
} from "@/lib/dynamic-widgets/schemas";

export function getByPath(row: unknown, path: string): unknown {
  if (!path) return undefined;
  const parts = path.split(".");
  let current: unknown = row;
  for (const part of parts) {
    if (current == null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

export function mapRowsToOptions(
  rows: unknown[],
  mapping?: OptionMapping,
): StaticOption[] {
  const valueKey = mapping?.value ?? "_id";
  const labelKey = mapping?.label ?? "fullName";
  const descriptionKey = mapping?.description;

  const options: StaticOption[] = [];
  for (const row of rows) {
    const value = String(getByPath(row, valueKey) ?? "");
    if (!value) continue;
    const label = String(
      getByPath(row, labelKey) ?? getByPath(row, "name") ?? value,
    );
    const description = descriptionKey
      ? String(getByPath(row, descriptionKey) ?? "") || undefined
      : undefined;
    options.push({ value, label, description });
  }
  return options.slice(0, 50);
}

export function resolveStaticOptions(dataSource: DataSource): StaticOption[] {
  if (dataSource.source === "static") return dataSource.options.slice(0, 50);
  return [];
}

export function formatCellValue(
  value: unknown,
  format?: "text" | "percentage" | "date" | "number",
): string {
  if (value == null || value === "") return "—";
  if (format === "percentage") {
    const n = Number(value);
    return Number.isFinite(n) ? `${n}%` : String(value);
  }
  if (format === "date") {
    const d = new Date(String(value));
    return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleDateString();
  }
  if (format === "number") {
    const n = Number(value);
    return Number.isFinite(n) ? String(n) : String(value);
  }
  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

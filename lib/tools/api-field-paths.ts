import { z } from "zod";

function unwrapSchema(schema: z.ZodType): z.ZodType {
  let current = schema;

  while (
    current instanceof z.ZodOptional ||
    current instanceof z.ZodNullable ||
    current instanceof z.ZodDefault
  ) {
    current = current.unwrap() as z.ZodType;
  }

  if (current instanceof z.ZodArray) {
    return unwrapSchema(current.element as z.ZodType);
  }

  return current;
}

export function fieldPaths(schema: z.ZodType, prefix = ""): string[] {
  const current = unwrapSchema(schema);

  if (!(current instanceof z.ZodObject)) {
    return prefix ? [prefix] : [];
  }

  return Object.entries(current.shape).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    const child = unwrapSchema(value as z.ZodType);

    if (child instanceof z.ZodObject) {
      return [path, ...fieldPaths(child, path)];
    }

    return [path];
  });
}

/** Drop paths equal to a prefix or nested under it (`courseCentre`, `courseCentre.name`). */
export function omitPathPrefixes(paths: string[], prefixes: string[]): string[] {
  if (prefixes.length === 0) return paths;
  return paths.filter(
    (path) =>
      !prefixes.some(
        (prefix) => path === prefix || path.startsWith(`${prefix}.`),
      ),
  );
}

export function fieldEnumFromRow(
  rowSchema: z.ZodType,
  options?: { omitPrefixes?: string[] },
) {
  const paths = omitPathPrefixes(
    fieldPaths(rowSchema),
    options?.omitPrefixes ?? [],
  );

  if (paths.length === 0) {
    throw new Error("Row schema has no fields to filter.");
  }

  return z.enum(paths as [string, ...string[]]);
}

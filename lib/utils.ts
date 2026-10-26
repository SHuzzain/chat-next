export { cn } from "cn";

export function toApiField(
  field: string,
  fieldAliases: Record<string, string>,
): string {
  return fieldAliases[field] ?? field;
}

/**
 * Catalog keys use `module.path:action`. Accept mistaken `module.path.action`
 * (last `.` → `:`) without rewriting dots inside the module path.
 */
export function normalizeCapabilityKey(key: string): string {
  const trimmed = key.trim();
  if (!trimmed) return trimmed;
  if (trimmed.includes(":")) return trimmed;
  const lastDot = trimmed.lastIndexOf(".");
  if (lastDot === -1) return trimmed;
  return `${trimmed.slice(0, lastDot)}:${trimmed.slice(lastDot + 1)}`;
}

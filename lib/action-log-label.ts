/**
 * Odd tool ids only. Prefer clear file names so new tools need no entry here.
 */
const OVERRIDES: Record<string, string> = {
  "get-users": "searching learners",
  "users-get-users": "searching learners",
  "list-centre": "searching centres",
  "centres-list-centre": "searching centres",
  "list-course-centres": "searching centres",
  "centres-list-course-centres": "searching centres",
  "list-user-types": "searching user types",
  "user-types-list-user-types": "searching user types",
  "list-staff-types": "searching staff types",
  "staff-types-list-staff-types": "searching staff types",
  "create-user": "creating user",
  "users-create-user": "creating user",
  "lesson-overall-reprot": "loading lesson report",
  "reports-lesson-overall-reprot": "loading lesson report",
  "search-mindchamps-knowledge": "searching MindChamps knowledge",
  "knowledge-search-mindchamps-knowledge": "searching MindChamps knowledge",
  widget_form: "showing form",
};

/** Tools that render their own ask UI — never show an action-log line for these. */
export const ASK_WIDGET_TOOLS = new Set([
  "widget_select",
  "widget_multi_select",
  "widget_search",
  "widget_data_table",
  "widget_form",
]);

/**
 * Derive a short action-log label from the Eve tool id.
 * Nested folders become prefixes (`class-list-classes`); those are stripped.
 */
export function friendlyToolLabel(toolName: string): string {
  if (OVERRIDES[toolName]) return OVERRIDES[toolName];

  const base = toolName
    .replace(/[_/]+/g, "-")
    .replace(/^(users|class|centres|reports)-/, "");

  if (/^(list|get)-/.test(base)) {
    return `searching ${base.replace(/^(list|get)-/, "").replace(/-/g, " ")}`;
  }

  if (/-report$/.test(base) || /session-users$/.test(base)) {
    return `loading ${base.replace(/-/g, " ")}`;
  }

  return base.replace(/-/g, " ").trim().toLowerCase();
}

export function formatElapsedMs(ms: number): string {
  return `${Math.max(0, Math.round(ms))}ms`;
}

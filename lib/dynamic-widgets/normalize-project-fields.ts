/**
 * Drop parent paths when any nested child is also selected.
 * ["course", "course.name"] → ["course.name"]
 */
export function normalizeProjectFields(
  fields: readonly string[] = [],
): string[] {
  const uniqueFields = [
    ...new Set(
      fields
        .map((field) => field.trim())
        .filter(Boolean),
    ),
  ];

  return uniqueFields.filter((field) => {
    const hasNestedSelection = uniqueFields.some(
      (candidate) =>
        candidate !== field && candidate.startsWith(`${field}.`),
    );

    return !hasNestedSelection;
  });
}

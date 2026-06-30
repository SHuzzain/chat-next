const MAX_LIST_ITEMS = 8;
const PLACEHOLDER_PATTERN =
  /placeholder|example\.com|your_|xxx|todo|fake|sample/i;

const MONGO_ID_PATTERN = /^[a-f\d]{24}$/i;

export function isInvalidMongoId(value: unknown): boolean {
  if (typeof value !== "string" || !value.trim()) return false;
  if (PLACEHOLDER_PATTERN.test(value)) return true;
  return !MONGO_ID_PATTERN.test(value);
}

export function validateMongoIdArgs(
  args: Record<string, unknown>,
  idKeys: string[],
  requiredKeys?: string[]
): string | null {
  const required = new Set(requiredKeys ?? []);
  for (const key of idKeys) {
    const value = args[key];
    if (value === undefined || value === null) {
      if (required.has(key)) {
        return `Missing required ${key}: must be a real 24-character MongoDB id.`;
      }
      continue;
    }
    if (isInvalidMongoId(value)) {
      return `Invalid ${key}: must be a real 24-character MongoDB id, not a placeholder or display name. Resolve the id first or omit optional filters.`;
    }
  }
  return null;
}

function pick<T extends Record<string, unknown>>(
  obj: T,
  keys: string[]
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of keys) {
    if (obj[key] !== undefined) out[key] = obj[key];
  }
  return out;
}

function slimCentreItem(item: unknown) {
  if (!item || typeof item !== "object") return item;
  const row = item as Record<string, unknown>;
  return pick(row, ["_id", "name", "code", "status"]);
}

function slimLiveClassItem(item: unknown) {
  if (!item || typeof item !== "object") return item;
  const row = item as Record<string, unknown>;
  const course = Array.isArray(row.course)
    ? row.course.map((c) =>
        c && typeof c === "object"
          ? pick(c as Record<string, unknown>, ["_id", "name", "code"])
          : c
      )
    : row.course;

  return {
    ...pick(row, [
      "_id",
      "title",
      "type",
      "status",
      "total",
      "totalJoined",
      "totalNotJoined",
      "order",
      "createdAt",
    ]),
    classLastTime: row.classLastTime,
    course,
  };
}

function slimUserItem(item: unknown) {
  if (!item || typeof item !== "object") return item;
  const row = item as Record<string, unknown>;
  return pick(row, [
    "_id",
    "fullName",
    "email",
    "username",
    "status",
    "role",
  ]);
}

function slimIntakeItem(item: unknown) {
  if (!item || typeof item !== "object") return item;
  const row = item as Record<string, unknown>;
  return pick(row, ["_id", "name", "code", "status", "progress"]);
}

function slimListItem(item: unknown, endpoint: string) {
  if (endpoint.includes("liveclasses")) return slimLiveClassItem(item);
  if (endpoint.includes("/intakes")) return slimIntakeItem(item);
  if (endpoint.includes("course-centres")) return slimCentreItem(item);
  if (endpoint.includes("/users")) return slimUserItem(item);
  if (endpoint.includes("get-user-intakes") || endpoint.includes("get-my-intakes")) {
    // learning my intakes: { courseId, courseName }
    if (!item || typeof item !== "object") return item;
    const row = item as Record<string, unknown>;
    return { courseId: row.courseId || row._id, courseName: row.courseName || row.name };
  }
  if (endpoint.includes("get-course-units") || endpoint.includes("get-all-intakes")) {
    // units list - keep core fields
    if (!item || typeof item !== "object") return item;
    const row = item as Record<string, unknown>;
    return pick(row, ["_id", "title", "name", "type", "order", "status", "progress", "isLiving"]);
  }
  if (!item || typeof item !== "object") return item;
  const row = item as Record<string, unknown>;
  return pick(row, ["_id", "name", "title", "code", "status", "type"]);
}

export function trimToolResult(result: unknown, endpoint: string): unknown {
  if (!result || typeof result !== "object") return result;

  const response = result as {
    error?: boolean;
    success?: boolean;
    payload?: Record<string, unknown>;
  };

  if (response.error) return result;

  const payload = response.payload;
  if (!payload || typeof payload !== "object") return result;

  if (!Array.isArray(payload.data)) return result;

  const total = payload.data.length;
  const trimmed = payload.data
    .slice(0, MAX_LIST_ITEMS)
    .map((item) => slimListItem(item, endpoint));

  return {
    success: response.success ?? true,
    payload: {
      currentPage: payload.currentPage,
      totalPage: payload.totalPage,
      totalItems: payload.totalItems ?? total,
      data: trimmed,
      ...(total > MAX_LIST_ITEMS
        ? {
            truncated: true,
            showing: MAX_LIST_ITEMS,
            message: `Showing first ${MAX_LIST_ITEMS} of ${total} items. Use page/rowPerPage or narrower filters for more.`,
          }
        : {}),
    },
  };
}
/**
 * LMS wire boundary.
 *
 * Each list/report schema owns `fieldAliases` (agent path → LMS path).
 * Call `toWireRequest` once before lmsFetch; call `fromWireResponse` after.
 *
 * Agent sees: class, centre, class.name, centre.name, …
 * LMS sees:   course, courseCentre, course.name, courseCentre.name, …
 */

export const CENTRE_ID_DESCRIBE = "Centre id (branch/company)";

export const CLASS_ID_DESCRIBE =
  "Class id. Resolve via list-classes. Never put a Class id in centreId.";

export const PARENT_COURSE_ID_DESCRIBE =
  "Parent Course id (course template), not a Class id and not a Centre id.";

/** Agent filter/select/sort path → LMS path. */
export type FieldAliases = Record<string, string>;

export type WireIdMap = {
  classId?: "course";
  centreId?: "courseCentre";
  parentCourseId?: "course" | "parentCourse";
};

const DEFAULT_ID_MAP: Required<WireIdMap> = {
  classId: "course",
  centreId: "courseCentre",
  parentCourseId: "parentCourse",
};

function segmentAliases(aliases: FieldAliases): Record<string, string> {
  return Object.fromEntries(
    Object.entries(aliases).filter(([key]) => !key.includes(".")),
  );
}

function renamePathSegments(path: string, map: Record<string, string>): string {
  return path
    .split(".")
    .map((segment) => map[segment] ?? segment)
    .join(".");
}

function renameObjectKeys(
  value: unknown,
  keyMap: Record<string, string>,
): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => renameObjectKeys(item, keyMap));
  }
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [
        keyMap[key] ?? key,
        renameObjectKeys(item, keyMap),
      ]),
    );
  }
  return value;
}

/** Map one agent field path to an LMS path (exact alias, else segment rewrite). */
export function toApiField(field: string, aliases: FieldAliases = {}): string {
  if (aliases[field]) return aliases[field];
  return renamePathSegments(field, segmentAliases(aliases));
}

function invertSegmentAliases(aliases: FieldAliases): Record<string, string> {
  return Object.fromEntries(
    Object.entries(segmentAliases(aliases)).map(([agent, wire]) => [
      wire,
      agent,
    ]),
  );
}

function mapQueryIds(
  query: Record<string, unknown>,
  idMap: WireIdMap,
): Record<string, unknown> {
  const resolved = { ...DEFAULT_ID_MAP, ...idMap };
  const { classId, centreId, parentCourseId, ...rest } = query;
  const wire: Record<string, unknown> = { ...rest };

  if (classId !== undefined && classId !== null && classId !== "") {
    wire[resolved.classId] = classId;
  }
  if (centreId !== undefined && centreId !== null && centreId !== "") {
    wire[resolved.centreId] = centreId;
  }
  if (
    parentCourseId !== undefined &&
    parentCourseId !== null &&
    parentCourseId !== ""
  ) {
    wire[resolved.parentCourseId] = parentCourseId;
  }

  return wire;
}

function mapFilterAndSelect(
  body: Record<string, unknown>,
  aliases: FieldAliases,
): Record<string, unknown> {
  if (Object.keys(aliases).length === 0) return body;

  const next: Record<string, unknown> = { ...body };

  if (Array.isArray(next.advanceFilterSelect)) {
    next.advanceFilterSelect = next.advanceFilterSelect.map((path) =>
      typeof path === "string" ? toApiField(path, aliases) : path,
    );
  }

  if (Array.isArray(next.advanceFilter)) {
    next.advanceFilter = next.advanceFilter.map((item) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) return item;
      const filter = { ...(item as Record<string, unknown>) };
      if (typeof filter.field === "string") {
        filter.field = toApiField(filter.field, aliases);
      }
      return filter;
    });
  }

  return next;
}

export type ToWireRequestInput = {
  query?: Record<string, unknown>;
  body?: Record<string, unknown>;
  /** From the feature schema — agent paths → LMS paths. */
  fieldAliases?: FieldAliases;
  /** Override query id key mapping when needed (e.g. parentCourseId → course). */
  idMap?: WireIdMap;
};

/**
 * Single pre-request converter.
 * - query: classId / centreId / parentCourseId → LMS keys; order via fieldAliases
 * - body: advanceFilter.field + advanceFilterSelect via fieldAliases
 */
export function toWireRequest(input: ToWireRequestInput): {
  query: Record<string, unknown>;
  body: Record<string, unknown>;
} {
  const aliases = input.fieldAliases ?? {};
  const query = mapQueryIds({ ...(input.query ?? {}) }, input.idMap ?? {});

  if (typeof query.order === "string" && Object.keys(aliases).length > 0) {
    query.order = toApiField(query.order, aliases);
  }

  return {
    query,
    body: mapFilterAndSelect({ ...(input.body ?? {}) }, aliases),
  };
}

/**
 * Rename LMS response keys to agent names using reverse of fieldAliases
 * segment map (e.g. courseCentre → centre, course → class when aliased).
 */
export function fromWireResponse<T = unknown>(
  payload: unknown,
  fieldAliases: FieldAliases = {},
): T {
  const reverse = invertSegmentAliases(fieldAliases);
  if (Object.keys(reverse).length === 0) return payload as T;
  return renameObjectKeys(payload, reverse) as T;
}

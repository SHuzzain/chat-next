/**
 * LMS wire boundary.
 *
 * Each endpoint that renames fields owns one FieldAlias (agent path → LMS path).
 * Call `toWireRequest` before lmsFetch. Validate with `outputSchema`, which
 * renames LMS keys on the page after the wire row is checked.
 *
 * Agent sees: class, centre, class.name, centre.name, …
 * LMS sees:   course, courseCentre, course.name, courseCentre.name, …
 */
import { z } from "zod";

import { lmsPageSchema } from "./api-response";

export const CENTRE_ID_DESCRIBE = "Centre id";

export const CLASS_ID_DESCRIBE = "Class id";

export const PARENT_COURSE_ID_DESCRIBE = "Parent Course id";

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

export type ToWireRequestInput = {
  query?: Record<string, unknown>;
  body?: Record<string, unknown>;
  /** Override query id key mapping when needed (e.g. parentCourseId → course). */
  idMap?: WireIdMap;
};

function segmentAliases(aliases: FieldAliases): Record<string, string> {
  return Object.fromEntries(
    Object.entries(aliases).filter(([key]) => !key.includes(".")),
  );
}

function renamePathSegments(
  path: string,
  map: Record<string, string>,
): string {
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

/**
 * One agent → LMS field map for a single endpoint.
 * Reverse names are derived, so response rename cannot drift from the request map.
 */
export class FieldAlias {
  private readonly aliases: FieldAliases;
  private readonly segments: Record<string, string>;
  private readonly reverseSegments: Record<string, string>;

  constructor(aliases: FieldAliases = {}) {
    this.aliases = aliases;
    this.segments = segmentAliases(aliases);
    this.reverseSegments = Object.fromEntries(
      Object.entries(this.segments).map(([agent, wire]) => [wire, agent]),
    );
  }

  /** Exact alias wins, otherwise each path segment is rewritten. */
  toApiField(field: string): string {
    if (this.aliases[field]) return this.aliases[field];
    return renamePathSegments(field, this.segments);
  }

  /**
   * Query ids, sort path, advanceFilter.field, and advanceFilterSelect.
   * Filter operator and value are left unchanged.
   */
  toWireRequest(input: ToWireRequestInput = {}): {
    query: Record<string, unknown>;
    body: Record<string, unknown>;
  } {
    const query = mapQueryIds(
      { ...(input.query ?? {}) },
      input.idMap ?? {},
    );

    if (typeof query.order === "string" && Object.keys(this.aliases).length > 0) {
      query.order = this.toApiField(query.order);
    }

    return {
      query,
      body: this.mapFilterAndSelect({ ...(input.body ?? {}) }),
    };
  }

  /**
   * Validate the LMS page, then rename wire keys on each row.
   * The returned schema uses `.transform()`, so it must not be an Eve `outputSchema`
   * (JSON Schema cannot represent transforms). Use {@link readPage} in API code.
   */
  outputSchema<T extends z.ZodObject<z.ZodRawShape>>(rowSchema: T) {
    return lmsPageSchema(rowSchema).transform((page) => this.fromWire(page));
  }

  /** Parse an LMS page against the wire row, then rename keys to agent names. */
  readPage<T extends z.ZodObject<z.ZodRawShape>>(
    wireRow: T,
    payload: unknown,
  ) {
    return this.fromWire(lmsPageSchema(wireRow).parse(payload));
  }

  /** Rename LMS keys to agent names. No-op when this map has no segment aliases. */
  fromWire<T>(payload: T): T {
    if (Object.keys(this.reverseSegments).length === 0) return payload;
    return renameObjectKeys(payload, this.reverseSegments) as T;
  }

  private mapFilterAndSelect(
    body: Record<string, unknown>,
  ): Record<string, unknown> {
    if (Object.keys(this.aliases).length === 0) return body;

    const next: Record<string, unknown> = { ...body };

    if (Array.isArray(next.advanceFilterSelect)) {
      next.advanceFilterSelect = next.advanceFilterSelect.map((path) =>
        typeof path === "string" ? this.toApiField(path) : path,
      );
    }

    if (Array.isArray(next.advanceFilter)) {
      next.advanceFilter = next.advanceFilter.map((item) => {
        if (!item || typeof item !== "object" || Array.isArray(item)) {
          return item;
        }
        const filter = { ...(item as Record<string, unknown>) };
        if (typeof filter.field === "string") {
          filter.field = this.toApiField(filter.field);
        }
        return filter;
      });
    }

    return next;
  }
}

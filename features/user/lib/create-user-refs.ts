import { listCourseCentresByAdvanceFilter } from "@/features/centres";
import { listStaffTypes } from "@/features/staff-type";
import { listUserTypes } from "@/features/user-type";
import type { LmsAuth } from "@/lib/auth";
import { LmsApiError } from "@/lib/tools/api-client";

export type ResolvedCentre = {
  _id: string;
  name?: string;
  code?: string;
  businessTypeId?: string;
};

export type ResolvedStaffType = {
  _id: string;
  staffType?: string;
};

export type ResolvedUserType = {
  _id: string;
  name?: string;
};

function missingIds(
  requested: string[],
  found: Array<string | undefined>,
): string[] {
  const present = new Set(
    found.filter((id): id is string => typeof id === "string" && id.length > 0),
  );
  return requested.filter((id) => !present.has(id));
}

function refId(value: unknown): string | undefined {
  if (typeof value === "string" && value.length > 0) return value;
  if (value && typeof value === "object" && "_id" in value) {
    const id = (value as { _id?: unknown })._id;
    if (typeof id === "string" && id.length > 0) return id;
  }
  return undefined;
}

function wrapLmsError(error: unknown): never {
  if (error instanceof LmsApiError) {
    throw new Error(error.message);
  }
  throw error;
}

/** Unique business-type ids from verified centres (for staff-type scoping). */
export function businessTypeIdsFromCentres(
  centres: ResolvedCentre[],
): string[] {
  return [
    ...new Set(
      centres
        .map((centre) => centre.businessTypeId)
        .filter((id): id is string => typeof id === "string" && id.length > 0),
    ),
  ];
}

/** Confirm every centre id exists and is visible to the signed-in user. */
export async function resolveCentresForCreate(
  centreIds: string[],
  auth: LmsAuth,
): Promise<ResolvedCentre[]> {
  const uniqueIds = [...new Set(centreIds)];
  try {
    const page = await listCourseCentresByAdvanceFilter(
      {
        page: 1,
        rowPerPage: Math.max(uniqueIds.length, 1),
      },
      auth,
      {
        advanceFilter: [{ field: "_id", type: "Equals", value: uniqueIds }],
        advanceFilterSelect: ["_id", "name", "code", "businessType"],
      },
    );

    const byId = new Map<string, ResolvedCentre>();
    for (const row of page.data) {
      if (!row._id) continue;
      byId.set(row._id, {
        _id: row._id,
        name: row.name,
        code: row.code,
        businessTypeId: refId(row.businessType),
      });
    }

    const missing = missingIds(uniqueIds, [...byId.keys()]);
    if (missing.length > 0) {
      throw new Error(
        `Unknown or inaccessible centre id(s): ${missing.join(", ")}. Use list-centre to pick valid centres.`,
      );
    }

    return centreIds.map((id) => byId.get(id)!);
  } catch (error) {
    wrapLmsError(error);
  }
}

/**
 * Confirm staff type id exists. When businessTypeIds is non-empty, scope the
 * lookup to those business types (from selected centres).
 */
export async function resolveStaffTypeForCreate(
  staffTypeId: string,
  auth: LmsAuth,
  businessTypeIds: string[] = [],
): Promise<ResolvedStaffType> {
  try {
    const page = await listStaffTypes(
      {
        page: 1,
        rowPerPage: 1,
      },
      auth,
      {
        advanceFilter: [{ field: "_id", type: "Equals", value: [staffTypeId] }],
        advanceFilterSelect: ["_id", "staffType"],
        ...(businessTypeIds.length > 0 ? { businessTypeIds } : {}),
      },
    );

    const row =
      page.data.find((item) => item._id === staffTypeId) ?? page.data[0];
    if (!row?._id || row._id !== staffTypeId) {
      throw new Error(
        businessTypeIds.length > 0
          ? `Unknown or inaccessible staff type id for the selected centre business types: ${staffTypeId}. Use list-staff-types to pick a valid staff type.`
          : `Unknown or inaccessible staff type id: ${staffTypeId}. Use list-staff-types to pick a valid staff type.`,
      );
    }

    return {
      _id: row._id,
      staffType: row.staffType,
    };
  } catch (error) {
    wrapLmsError(error);
  }
}

/** Confirm user type id exists (Super Admin already excluded by LMS list). */
export async function resolveUserTypeForCreate(
  typeId: string,
  auth: LmsAuth,
): Promise<ResolvedUserType> {
  try {
    let lastId: string | undefined;
    for (let pageIndex = 0; pageIndex < 20; pageIndex += 1) {
      const page = await listUserTypes(
        {
          rowPerPage: 100,
          ...(lastId ? { lastId } : {}),
        },
        auth,
      );
      const row = page.data.find((item) => item._id === typeId);
      if (row?._id) {
        return { _id: row._id, name: row.name };
      }
      if (page.data.length === 0) break;
      const nextLast = page.data[page.data.length - 1]?._id;
      if (!nextLast || nextLast === lastId) break;
      lastId = nextLast;
    }
    throw new Error(
      `Unknown or inaccessible user type id: ${typeId}. Use list-user-types to pick a valid type (never Super Admin).`,
    );
  } catch (error) {
    wrapLmsError(error);
  }
}

export function centreLabels(centres: ResolvedCentre[]): string {
  return centres
    .map((centre) => centre.name?.trim() || centre.code?.trim() || centre._id)
    .join(", ");
}

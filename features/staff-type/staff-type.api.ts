import type { LmsAuth } from "@/lib/auth";
import { lmsFetch } from "@/lib/tools/api-client";

import {
  staffTypeListFields,
  staffTypeListSchema,
  staffTypeWireRowSchema,
  type StaffTypeList,
} from "./schema/staff-type-list";

/** Rename agent-only query keys that FieldAlias idMap does not cover. */
function mapExtraQueryIds(
  query: Record<string, unknown>,
): Record<string, unknown> {
  const {
    businessTypeId,
    currentStaffTypeId,
    ...rest
  } = query;
  const wire: Record<string, unknown> = { ...rest };
  if (
    businessTypeId !== undefined &&
    businessTypeId !== null &&
    businessTypeId !== ""
  ) {
    wire.businessType = businessTypeId;
  }
  if (
    currentStaffTypeId !== undefined &&
    currentStaffTypeId !== null &&
    currentStaffTypeId !== ""
  ) {
    wire.currentStaffType = currentStaffTypeId;
  }
  return wire;
}

export async function listStaffTypes(
  query: StaffTypeList["query"],
  auth: LmsAuth,
  body: StaffTypeList["body"],
): Promise<StaffTypeList["output"]> {
  const { query: aliasedQuery, body: wireBody } =
    staffTypeListFields.toWireRequest({
      query: staffTypeListSchema.query.parse(query ?? {}) as Record<
        string,
        unknown
      >,
      body: staffTypeListSchema.body.parse(body ?? {}) as Record<
        string,
        unknown
      >,
    });
  const wireQuery = mapExtraQueryIds(aliasedQuery);

  const payload = await lmsFetch("staff-type/get-staff-types", {
    method: "POST",
    query: wireQuery,
    body: wireBody,
    auth,
  });

  return staffTypeListSchema.output.parse(
    staffTypeListFields.readPage(staffTypeWireRowSchema, payload),
  );
}

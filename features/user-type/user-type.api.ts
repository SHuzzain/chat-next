import type { LmsAuth } from "@/lib/auth";
import { lmsFetch } from "@/lib/tools/api-client";

import {
  userTypeListRowSchema,
  userTypeListSchema,
  type UserTypeList,
} from "./schema/user-type-list";

function isSuperAdminType(row: {
  systemRole?: string;
  defaultRole?: string;
  key?: string;
  roles?: string[];
}): boolean {
  return (
    row.systemRole === "SUPER_ADMIN" ||
    row.defaultRole === "SUPER_ADMIN" ||
    row.key === "SUPER_ADMIN" ||
    (row.roles ?? []).includes("SUPER_ADMIN")
  );
}

/** Build GET query for /user-types/list — only backend-supported keys. */
function toListQuery(
  query: UserTypeList["query"],
): Record<string, string | number> {
  const out: Record<string, string | number> = {};
  if (query.rowPerPage !== undefined) out.rowPerPage = query.rowPerPage;
  if (query.firstId) out.firstId = query.firstId;
  if (query.lastId) out.lastId = query.lastId;
  if (query.textSearch?.trim()) out.textSearch = query.textSearch.trim();
  return out;
}

export async function listUserTypes(
  query: UserTypeList["query"],
  auth: LmsAuth,
  _body?: UserTypeList["body"],
): Promise<UserTypeList["output"]> {
  const parsedQuery = userTypeListSchema.query.parse(query ?? {});
  const payload = await lmsFetch<unknown>("user-types/list", {
    method: "GET",
    auth,
    query: toListQuery(parsedQuery),
  });

  const rows = Array.isArray(payload) ? payload : [];
  const data = rows
    .map((row) => userTypeListRowSchema.parse(row))
    .filter((row) => !isSuperAdminType(row));

  return userTypeListSchema.output.parse({
    data,
    totalItems: data.length,
    totalPage: 1,
    currentPage: 1,
  });
}

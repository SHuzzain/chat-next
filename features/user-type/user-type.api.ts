import type { LmsAuth } from "@/lib/auth";
import { lmsFetch } from "@/lib/tools/api-client";
import { paginationParams } from "@/lib/tools/api-pagination";

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

export async function listUserTypes(
  query: UserTypeList["query"],
  auth: LmsAuth,
  _body?: UserTypeList["body"],
): Promise<UserTypeList["output"]> {
  const parsedQuery = userTypeListSchema.query.parse(query ?? {});
  const payload = await lmsFetch<unknown>("user-types/list", {
    method: "GET",
    auth,
    query: {
      ...paginationParams(parsedQuery),
      ...(parsedQuery.textSearch
        ? { textSearch: parsedQuery.textSearch }
        : {}),
    },
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

import type { LmsAuth } from "@/lib/auth";
import { canViewUsers } from "@/lib/permissions";
import { lmsFetch } from "@/lib/tools/api-client";
import { FieldAlias } from "@/lib/tools/api-wire";

import { userInfoListSchema } from "./schema";
import type { UserInfoList } from "./user.type";

function warnRole(auth: LmsAuth) {
  if (!canViewUsers(auth)) {
    console.warn(
      "user list access is outside the advisory role list; LMS will decide",
    );
  }
}

export async function listUsers(
  query: UserInfoList["query"],
  auth: LmsAuth,
  body: UserInfoList["body"],
): Promise<UserInfoList["output"]> {
  warnRole(auth);
  const { query: wireQuery, body: wireBody } = new FieldAlias().toWireRequest({
    query: userInfoListSchema.query.parse(query) as Record<string, unknown>,
    body: userInfoListSchema.body.parse(body ?? {}) as Record<string, unknown>,
  });
  const payload = await lmsFetch("users/get-users", {
    method: "POST",
    query: wireQuery,
    body: wireBody,
    auth,
  });
  return userInfoListSchema.output.parse(payload);
}

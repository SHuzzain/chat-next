import type { LmsAuth } from "@/lib/auth";
import { canCreateUsers, canViewUsers } from "@/lib/permissions";
import { lmsFetch, lmsFetchForm } from "@/lib/tools/api-client";

import {
  userInfoFields,
  userInfoListSchema,
  userInfoWireRowSchema,
} from "./schema";
import {
  buildUserCreateFormData,
  toUserCreateWireData,
  userCreateInputSchema,
  userCreateResultSchema,
  type UserCreateInput,
  type UserCreateResult,
} from "./schema/user-create";
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
  const { query: wireQuery, body: wireBody } = userInfoFields.toWireRequest({
    query: userInfoListSchema.query.parse(query) as Record<string, unknown>,
    body: userInfoListSchema.body.parse(body ?? {}) as Record<string, unknown>,
  });
  const payload = await lmsFetch("users/get-users", {
    method: "POST",
    query: wireQuery,
    body: wireBody,
    auth,
  });
  return userInfoListSchema.output.parse(
    userInfoFields.readPage(userInfoWireRowSchema, payload),
  );
}

export async function createUser(
  input: UserCreateInput,
  password: string,
  languageId: string,
  auth: LmsAuth,
): Promise<UserCreateResult> {
  if (!canCreateUsers(auth)) {
    console.warn(
      "user create access is outside the advisory role list; LMS will decide",
    );
  }
  const createInput = userCreateInputSchema.parse(input);
  const wire = toUserCreateWireData(createInput, password, languageId);
  const formData = buildUserCreateFormData(wire);
  const payload = await lmsFetchForm<unknown>("users", {
    method: "POST",
    formData,
    auth,
  });
  const created = userCreateResultSchema.parse(payload);
  // Never surface password hashes or temp passwords to the model.
  const {
    password: _password,
    temPassword: _temPassword,
    ...safe
  } = created as UserCreateResult & {
    password?: unknown;
    temPassword?: unknown;
  };
  void _password;
  void _temPassword;
  return safe;
}

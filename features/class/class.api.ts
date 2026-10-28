import type { LmsAuth } from "@/lib/auth";
import { canViewClasses } from "@/lib/permissions";
import { lmsFetch } from "@/lib/tools/api-client";
import { FieldAlias } from "@/lib/tools/api-wire";

import { classListSchema } from "./schema";
import type { ClassList } from "./class.type";

function warnRole(auth: LmsAuth) {
  if (!canViewClasses(auth)) {
    console.warn(
      "class list access is outside the advisory role list; LMS will decide",
    );
  }
}

export async function listClasses(
  query: ClassList["query"],
  auth: LmsAuth,
  body: ClassList["body"],
): Promise<ClassList["output"]> {
  warnRole(auth);
  const { query: wireQuery, body: wireBody } = new FieldAlias().toWireRequest({
    query: classListSchema.query.parse(query) as Record<string, unknown>,
    body: classListSchema.body.parse(body ?? {}) as Record<string, unknown>,
    idMap: classListSchema.idMap,
  });
  const payload = await lmsFetch("intakes", {
    method: "POST",
    query: wireQuery,
    body: wireBody,
    auth,
  });
  return classListSchema.output.parse(payload);
}

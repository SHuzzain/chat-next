import type { LmsAuth } from "@/lib/auth";
import { canViewCourseCentres } from "@/lib/permissions";
import { lmsFetch } from "@/lib/tools/api-client";

import {
  centreListFields,
  centreListSchema,
  centreWireRowSchema,
} from "./schema";
import type { CentreList } from "./centre.types";

function warnRole(auth: LmsAuth) {
  if (!canViewCourseCentres(auth)) {
    console.warn(
      "course centre access is outside the advisory role list; LMS will decide",
    );
  }
}

export async function listCourseCentresByAdvanceFilter(
  query: CentreList["query"],
  auth: LmsAuth,
  body: CentreList["body"],
): Promise<CentreList["output"]> {
  warnRole(auth);
  const { query: wireQuery, body: wireBody } = centreListFields.toWireRequest({
    query: centreListSchema.query.parse(query) as Record<string, unknown>,
    body: centreListSchema.body.parse(body) as Record<string, unknown>,
  });
  const payload = await lmsFetch("course-centres/advance-filter", {
    method: "POST",
    query: wireQuery,
    body: wireBody,
    auth,
  });
  return centreListSchema.output.parse(
    centreListFields.readPage(centreWireRowSchema, payload),
  );
}

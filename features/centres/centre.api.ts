import type { LmsAuth } from "@/lib/auth";
import { canViewCourseCentres } from "@/lib/permissions";
import { lmsFetch } from "@/lib/tools/api-client";
import { toWireRequest } from "@/lib/tools/api-wire";

import { courseCentreListSchema } from "./schema";
import type { CourseCentreList } from "./centre.types";

function warnRole(auth: LmsAuth) {
  if (!canViewCourseCentres(auth)) {
    console.warn(
      "course centre access is outside the advisory role list; LMS will decide",
    );
  }
}

export async function listCourseCentresByAdvanceFilter(
  query: CourseCentreList["query"],
  auth: LmsAuth,
  body: CourseCentreList["body"],
): Promise<CourseCentreList["output"]> {
  warnRole(auth);
  const { query: wireQuery, body: wireBody } = toWireRequest({
    query: courseCentreListSchema.query.parse(query) as Record<
      string,
      unknown
    >,
    body: courseCentreListSchema.body.parse(body) as Record<string, unknown>,
  });
  const payload = await lmsFetch("course-centres/advance-filter", {
    method: "POST",
    query: wireQuery,
    body: wireBody,
    auth,
  });
  return courseCentreListSchema.output.parse(payload);
}

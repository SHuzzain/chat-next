import { unstable_cache } from "next/cache";

import { lmsAuthFromRequest, type LmsAuth } from "@/lib/auth";
import { LmsApiError, lmsFetch } from "@/lib/tools/api-client";

function privilegeCacheTtlSec(): number {
  const raw = Number(process.env.LMS_PRIVILEGE_CACHE_TTL_SEC);
  return Number.isFinite(raw) && raw > 0 ? raw : 300;
}

async function fetchKeysFromLms(auth: LmsAuth): Promise<string[]> {
  const payload = await lmsFetch<{ keys: string[] }>(
    "privileges/me/capabilities",
    {
      method: "GET",
      auth,
    },
  );
  return Array.isArray(payload?.keys) ? payload.keys.map(String) : [];
}

/**
 * Cached capability keys for the LMS principal.
 * Eve tools call this via LMS_AGENT_INTERNAL_URL so Next Data Cache can apply.
 *
 * Cache tags: `lms-privileges:{credentialId}` (revalidateTag on logout later).
 */
export async function GET(request: Request) {
  const auth = lmsAuthFromRequest(request);
  if (!auth) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  const credentialId =
    request.headers.get("x-lms-credential-id")?.trim() || "anonymous";
  const role =
    auth.role ||
    request.headers.get("role")?.trim() ||
    request.headers.get("x-lms-role")?.trim() ||
    "";

  const cacheAuth: LmsAuth = role ? { token: auth.token, role } : { token: auth.token };

  try {
    const keys = await unstable_cache(
      async () => fetchKeysFromLms(cacheAuth),
      ["lms-privileges", credentialId, role],
      {
        revalidate: privilegeCacheTtlSec(),
        tags: [`lms-privileges:${credentialId}`],
      },
    )();

    return Response.json({ keys });
  } catch (error) {
    if (error instanceof LmsApiError) {
      return Response.json(
        { message: error.message },
        { status: error.status },
      );
    }
    return Response.json(
      { message: "Unable to load privilege capabilities." },
      { status: 500 },
    );
  }
}

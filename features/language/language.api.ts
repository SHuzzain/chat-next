import type { LmsAuth } from "@/lib/auth";
import { lmsFetch } from "@/lib/tools/api-client";

import { languageSchema, type Language } from "./schema/main-schema";

const DEFAULT_LANGUAGE_VALUE = "en";

export async function listLanguages(auth: LmsAuth): Promise<Language[]> {
  const payload = await lmsFetch<unknown>("languages", {
    method: "GET",
    auth,
  });
  const rows = Array.isArray(payload) ? payload : [];
  return rows.map((row) => languageSchema.parse(row));
}

/** Resolve default language id (English). Never invent an id. */
export async function resolveDefaultLanguageId(
  auth: LmsAuth,
  explicitId?: string,
): Promise<string> {
  if (explicitId) return explicitId;
  const languages = await listLanguages(auth);
  const english = languages.find(
    (lang) => lang.value?.toLowerCase() === DEFAULT_LANGUAGE_VALUE,
  );
  if (english?._id) return english._id;
  if (languages[0]?._id) return languages[0]._id;
  throw new Error(
    "No LMS language id is available. Configure languages in the LMS.",
  );
}

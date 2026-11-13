/**
 * Map centre country names to LMS create-user dial codes.
 * Centre country docs store geo name/code, not phone dial — this table bridges them.
 * Dial list matches LMS frontend InformationUser options.
 */
export const LMS_DIAL_CODES = [
  "+65",
  "+61",
  "+1",
  "+63",
  "+60",
  "+95",
  "+62",
  "+91",
  "+43",
] as const;

export type LmsDialCode = (typeof LMS_DIAL_CODES)[number];

/** Lowercased country name / alias → dial. */
const COUNTRY_NAME_TO_DIAL: Record<string, LmsDialCode> = {
  singapore: "+65",
  australia: "+61",
  "united states": "+1",
  usa: "+1",
  "united states of america": "+1",
  philippines: "+63",
  malaysia: "+60",
  myanmar: "+95",
  burma: "+95",
  indonesia: "+62",
  india: "+91",
  austria: "+43",
};

export type CentreCountryInput = {
  _id?: string;
  /** Centre display name — not used for dial resolution. */
  name?: string;
  country?: { _id?: string; name?: string } | null;
};

export type DialResolveResult =
  | { status: "single"; countryCode: LmsDialCode; countries: string[] }
  | { status: "multiple"; options: LmsDialCode[]; countries: string[] }
  | { status: "ask"; reason: "missing" | "unmapped"; countries: string[] };

function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

export function dialCodeForCountryName(
  name: string | undefined | null,
): LmsDialCode | undefined {
  if (!name || !name.trim()) return undefined;
  return COUNTRY_NAME_TO_DIAL[normalizeName(name)];
}

function countryNameFromCentre(centre: CentreCountryInput): string | undefined {
  return centre.country?.name?.trim() || undefined;
}

/**
 * Derive dial code(s) from selected centres.
 * - One unique mapped dial → auto
 * - Multiple distinct dials → select among them
 * - Missing or unmapped country → ask (do not guess)
 */
export function resolveCountryDialFromCentres(
  centres: CentreCountryInput[],
): DialResolveResult {
  const countries: string[] = [];
  const dials = new Set<LmsDialCode>();
  let missing = false;
  let unmapped = false;

  for (const centre of centres) {
    const name = countryNameFromCentre(centre);
    if (!name) {
      missing = true;
      continue;
    }
    countries.push(name);
    const dial = dialCodeForCountryName(name);
    if (!dial) {
      unmapped = true;
      continue;
    }
    dials.add(dial);
  }

  if (missing && dials.size === 0) {
    return { status: "ask", reason: "missing", countries };
  }
  if (unmapped && dials.size === 0) {
    return { status: "ask", reason: "unmapped", countries };
  }
  if (missing || unmapped) {
    // Partial mapping — still ask rather than silently dropping centres.
    if (dials.size === 1) {
      return {
        status: "ask",
        reason: missing ? "missing" : "unmapped",
        countries,
      };
    }
    if (dials.size > 1) {
      return {
        status: "multiple",
        options: [...dials],
        countries,
      };
    }
    return {
      status: "ask",
      reason: missing ? "missing" : "unmapped",
      countries,
    };
  }

  if (dials.size === 0) {
    return { status: "ask", reason: "missing", countries };
  }
  if (dials.size === 1) {
    return {
      status: "single",
      countryCode: [...dials][0]!,
      countries,
    };
  }
  return {
    status: "multiple",
    options: [...dials],
    countries,
  };
}

export function dialSelectOptions(
  dials: readonly string[] = LMS_DIAL_CODES,
): Array<{ value: string; label: string }> {
  return dials.map((code) => ({ value: code, label: code }));
}

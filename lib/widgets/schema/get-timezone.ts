import { z } from "zod";

/** Arguments for {@link get_timezone}. No fields — the browser supplies the zone. */
export const getTimezoneParameters = z.object({});

export type GetTimezoneArgs = z.infer<typeof getTimezoneParameters>;

/** Result with the user's IANA time zone. */
export const getTimezoneResult = z.object({
  timeZone: z.string().min(1).describe("IANA time zone, e.g. Asia/Singapore"),
});

export type GetTimezoneResult = z.infer<typeof getTimezoneResult>;

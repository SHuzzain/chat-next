import type { LmsAuth } from "@/lib/auth";
import { lmsFetch } from "@/lib/tools/api-client";
import { z } from "zod";

const userIdSchema = z.object({ _id: z.string().min(1) }).loose();

export async function currentPrincipalId(auth: LmsAuth) {
  const payload = await lmsFetch("users/myself", {
    method: "POST",
    body: {},
    auth,
  });
  return userIdSchema.parse(payload)._id;
}

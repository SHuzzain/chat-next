import { z } from "zod";

import { lmsAuthFromRequest } from "@/lib/auth";
import { currentPrincipalId } from "@/lib/current-principal";
import { LmsApiError } from "@/lib/tools/api-client";
import { agentSecrets } from "@/lib/tools/agent-secret-store";

const bodySchema = z.object({
  secrets: z
    .record(z.string(), z.string().min(1))
    .refine((value) => Object.keys(value).length > 0, {
      message: "At least one secret is required.",
    }),
});

export async function POST(request: Request) {
  const auth = lmsAuthFromRequest(request);
  if (!auth) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ message: "Invalid secrets request." }, { status: 400 });
  }

  try {
    const principalId = await currentPrincipalId(auth);
    const secretId = agentSecrets.put({
      values: parsed.data.secrets,
      principalId,
    });
    return Response.json({ secretId });
  } catch (error) {
    if (error instanceof LmsApiError) {
      return Response.json(
        { message: error.message },
        { status: error.status },
      );
    }
    return Response.json(
      { message: "Unable to store secrets." },
      { status: 500 },
    );
  }
}

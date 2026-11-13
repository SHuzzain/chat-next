import { z } from "zod";

import { lmsAuthFromRequest } from "@/lib/auth";
import { currentPrincipalId } from "@/lib/current-principal";
import { LmsApiError } from "@/lib/tools/api-client";
import {
  AgentSecretError,
  agentSecrets,
} from "@/lib/tools/agent-secret-store";

const bodySchema = z.object({
  secretId: z.string().min(1),
});

function secretErrorResponse(error: AgentSecretError): Response {
  if (error.reason === "missing") {
    return Response.json(
      { message: "Secret is unavailable.", reason: "missing" },
      { status: 404 },
    );
  }
  if (error.reason === "expired") {
    return Response.json(
      { message: "Secret has expired.", reason: "expired" },
      { status: 410 },
    );
  }
  return Response.json(
    {
      message: "Secret does not match the signed-in user.",
      reason: "mismatch",
    },
    { status: 403 },
  );
}

/** One-time consume of a secret stored by POST /api/agent/secrets. */
export async function POST(request: Request) {
  const auth = lmsAuthFromRequest(request);
  if (!auth) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ message: "Invalid take request." }, { status: 400 });
  }

  try {
    const principalId = await currentPrincipalId(auth);
    const values = agentSecrets.take(parsed.data.secretId, principalId);
    return Response.json({ values });
  } catch (error) {
    if (error instanceof AgentSecretError) {
      return secretErrorResponse(error);
    }
    if (error instanceof LmsApiError) {
      return Response.json(
        { message: error.message },
        { status: error.status },
      );
    }
    return Response.json(
      { message: "Unable to take secret." },
      { status: 500 },
    );
  }
}

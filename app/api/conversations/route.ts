import { lmsAuthFromRequest } from "@/lib/auth";
import { listConversationsForPrincipal } from "@/lib/conversations";
import { currentPrincipalId } from "@/lib/current-principal";
import { LmsApiError } from "@/lib/tools/api-client";

export async function GET(request: Request) {
  const auth = lmsAuthFromRequest(request);
  if (!auth) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const principalId = await currentPrincipalId(auth);
    const conversations = await listConversationsForPrincipal(principalId);
    return Response.json({ conversations });
  } catch (error) {
    if (error instanceof LmsApiError) {
      return Response.json({ message: "Unauthorized" }, { status: 401 });
    }
    console.error("conversation list failed", error);
    return Response.json(
      { message: "Could not load conversations." },
      { status: 500 },
    );
  }
}

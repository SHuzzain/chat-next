import { lmsAuthFromRequest } from "@/lib/auth";
import { listConversationMessages } from "@/lib/conversations";
import { currentPrincipalId } from "@/lib/current-principal";
import { LmsApiError } from "@/lib/tools/api-client";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const auth = lmsAuthFromRequest(request);
  if (!auth) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  if (!id) {
    return Response.json({ message: "Conversation not found." }, { status: 404 });
  }

  try {
    const principalId = await currentPrincipalId(auth);
    const messages = await listConversationMessages(principalId, id);
    if (!messages) {
      return Response.json({ message: "Conversation not found." }, { status: 404 });
    }
    return Response.json({ messages });
  } catch (error) {
    if (error instanceof LmsApiError) {
      return Response.json({ message: "Unauthorized" }, { status: 401 });
    }
    console.error("conversation messages failed", error);
    return Response.json(
      { message: "Could not load this conversation." },
      { status: 500 },
    );
  }
}

import { executeVoiceToolGateway, VoiceToolGatewayError } from "@/agent/voice/tool-gateway";
import { lmsAuthFromRequest } from "@/lib/auth";
import { LmsApiError } from "@/lib/tools/api-client";
import { isSameOriginRequest } from "@/lib/voice/same-origin";

/**
 * Realtime function-call gateway.
 * Browser never calls LMS APIs here — only Eve (which runs existing tools + RBAC).
 */
export async function POST(request: Request) {
  const auth = lmsAuthFromRequest(request);
  if (!auth) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (!isSameOriginRequest(request)) {
    return Response.json({ message: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ message: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const result = await executeVoiceToolGateway({
      auth,
      body,
      signal: request.signal,
    });
    return Response.json(result, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    if (error instanceof VoiceToolGatewayError) {
      return Response.json({ message: error.message }, { status: error.status });
    }
    if (error instanceof LmsApiError) {
      return Response.json({ message: "Unauthorized" }, { status: 401 });
    }
    console.error("voice tool gateway failed", error);
    return Response.json(
      { message: "Could not run LMS assistant." },
      { status: 502 },
    );
  }
}

import { lmsAuthFromRequest } from "@/lib/auth";
import { currentPrincipalId } from "@/lib/current-principal";
import { LmsApiError } from "@/lib/tools/api-client";
import { readSdpOffer } from "@/lib/voice/read-sdp-offer";
import { realtimeSessionToolsConfig } from "@/lib/voice/realtime-tools";
import { isSameOriginRequest } from "@/lib/voice/same-origin";
import { VOICE_SESSION_INSTRUCTIONS } from "@/lib/voice/voice-instructions";

const REALTIME_MODEL = "gpt-realtime-2.1";
const REALTIME_VOICE = "marin";

export async function POST(request: Request) {
  const auth = lmsAuthFromRequest(request);
  if (!auth) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (!isSameOriginRequest(request)) {
    return new Response("Forbidden", { status: 403 });
  }

  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return new Response("Voice is not configured", { status: 503 });
  }

  try {
    await currentPrincipalId(auth);
  } catch (error) {
    if (error instanceof LmsApiError) {
      return new Response("Unauthorized", { status: 401 });
    }
    console.error("realtime auth principal failed", error);
    return new Response("Unauthorized", { status: 401 });
  }

  const offer = await readSdpOffer(request);
  if (offer instanceof Response) return offer;

  const body = new FormData();
  body.set("sdp", offer.sdp);
  body.set(
    "session",
    JSON.stringify({
      type: "realtime",
      model: REALTIME_MODEL,
      instructions: VOICE_SESSION_INSTRUCTIONS,
      output_modalities: ["audio"],
      ...realtimeSessionToolsConfig(),
      audio: {
        input: {
          transcription: { model: "gpt-4o-mini-transcribe" },
          turn_detection: {
            type: "server_vad",
            create_response: true,
            interrupt_response: true,
          },
        },
        output: { voice: REALTIME_VOICE },
      },
    }),
  );

  const response = await fetch("https://api.openai.com/v1/realtime/calls", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body,
    signal: request.signal,
  });

  if (!response.ok) {
    console.error(
      "openai realtime session failed",
      response.status,
      await response.text().catch(() => ""),
    );
    return new Response("Could not create voice session", { status: 502 });
  }

  return new Response(await response.text(), {
    headers: {
      "Content-Type": "application/sdp",
      "Cache-Control": "no-store",
    },
  });
}

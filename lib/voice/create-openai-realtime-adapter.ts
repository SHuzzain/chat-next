import {
  exchangeRealtimeSdp,
  type ExchangeSdpAuth,
} from "@/lib/voice/exchange-sdp";
import { invokeLmsTool } from "@/lib/voice/invoke-lms-tool";
import { OpenAIRealtimeVoiceAdapter } from "@/lib/voice/openai-realtime-voice-adapter";

/** Build the Realtime voice adapter for `useEveAgentRuntime({ adapters.voice })`. */
export function createOpenAIRealtimeVoiceAdapter(auth: ExchangeSdpAuth) {
  return new OpenAIRealtimeVoiceAdapter({
    exchangeSdp: (sdp, { signal }) => exchangeRealtimeSdp(sdp, auth, signal),
    invokeLmsTool: (input) => invokeLmsTool(auth, input),
  });
}

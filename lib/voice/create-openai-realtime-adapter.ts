import {
  exchangeRealtimeSdp,
  type ExchangeSdpAuth,
} from "@/lib/voice/exchange-sdp";
import { invokeLmsTool } from "@/lib/voice/invoke-lms-tool";
import {
  OpenAIRealtimeVoiceAdapter,
  type OpenAIRealtimeVoiceAdapterOptions,
} from "@/lib/voice/openai-realtime-voice-adapter";

export type CreateOpenAIRealtimeVoiceAdapterOptions = ExchangeSdpAuth &
  Pick<
    OpenAIRealtimeVoiceAdapterOptions,
    "getEveSessionId" | "onEveSessionId" | "onToolStatus"
  >;

/** Build the Realtime voice adapter for `useEveAgentRuntime({ adapters.voice })`. */
export function createOpenAIRealtimeVoiceAdapter(
  options: CreateOpenAIRealtimeVoiceAdapterOptions,
) {
  const { getEveSessionId, onEveSessionId, onToolStatus, ...auth } = options;
  return new OpenAIRealtimeVoiceAdapter({
    exchangeSdp: (sdp, { signal }) => exchangeRealtimeSdp(sdp, auth, signal),
    invokeLmsTool: (input) => invokeLmsTool(auth, input),
    getEveSessionId,
    onEveSessionId,
    onToolStatus,
  });
}

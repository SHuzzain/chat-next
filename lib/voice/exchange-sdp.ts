import { withBasePath } from "@/lib/base-path";

export type ExchangeSdpAuth = {
  getToken: () => string;
  getRole?: () => string | undefined;
};

/**
 * Exchange a browser SDP offer for an OpenAI Realtime answer via our Next route.
 * Pass `signal` so hangup cancels an in-flight connect.
 */
export async function exchangeRealtimeSdp(
  sdp: string,
  auth: ExchangeSdpAuth,
  signal: AbortSignal,
): Promise<string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/sdp",
    Authorization: `Bearer ${auth.getToken()}`,
  };
  const role = auth.getRole?.()?.trim();
  if (role) headers["x-lms-role"] = role;

  const response = await fetch(withBasePath("/api/realtime"), {
    method: "POST",
    headers,
    body: sdp,
    signal,
  });

  if (!response.ok) {
    throw new Error(
      response.status === 503
        ? "Voice is not configured"
        : "Could not connect voice",
    );
  }

  return response.text();
}

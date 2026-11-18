const MAX_SDP_BYTES = 64_000;

/**
 * Read and validate an SDP offer from a request body.
 * Returns a Response on failure, or `{ sdp }` on success.
 */
export async function readSdpOffer(
  request: Request,
): Promise<{ sdp: string } | Response> {
  const reader = request.body?.getReader();
  if (!reader) {
    return new Response("Missing connection offer", { status: 400 });
  }

  const decoder = new TextDecoder();
  let sdp = "";
  let bytes = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    if (bytes > MAX_SDP_BYTES) {
      await reader.cancel();
      return new Response("Connection offer too large", { status: 413 });
    }
    sdp += decoder.decode(value, { stream: true });
  }
  sdp += decoder.decode();

  if (!sdp.startsWith("v=0")) {
    return new Response("Invalid connection offer", { status: 400 });
  }

  return { sdp };
}

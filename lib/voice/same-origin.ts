/** True when the request is same-origin (or missing Origin, e.g. same-site nav). */
export function isSameOriginRequest(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

const STORAGE_KEY = "lms-agent-embed-session";

export type EmbedSession = {
  token: string;
};

export function saveEmbedSession(session: EmbedSession) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // ignore quota / private mode
  }
}

export function readEmbedSession(): EmbedSession | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return undefined;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return undefined;
    const token = (parsed as { token?: unknown }).token;
    if (typeof token !== "string" || !token.trim()) return undefined;
    return {
      token: token.trim(),
    };
  } catch {
    return undefined;
  }
}

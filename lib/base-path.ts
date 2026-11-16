/**
 * Next.js `basePath` (see next.config.ts). Browser `fetch("/api/...")` does
 * not auto-prefix — always use `withBasePath` for absolute app paths.
 */
export function appBasePath(): string {
  const raw = process.env.NEXT_PUBLIC_BASE_PATH?.trim() ?? "";
  if (!raw || raw === "/") return "";
  return raw.replace(/\/$/, "");
}

/** Prefix an app path (`/api/...`, `/embed`) with the configured basePath. */
export function withBasePath(path: string): string {
  const base = appBasePath();
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalized}`;
}

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Ensures a base origin string is a valid absolute URL with protocol.
 * Defaults to https if no protocol is present (common for backend-returned baseUrls).
 * Removes trailing slashes for clean concatenation with endpoints that start with /.
 */
export function ensureAbsoluteUrl(input: string): string {
  let url = (input || "").trim();
  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }
  url = url.replace(/\/+$/, "");
  return url;
}

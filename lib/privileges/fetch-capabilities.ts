import type { LmsToolContext } from "@/lib/tools/api-tool-context";
import { withBasePath } from "@/lib/base-path";

function agentInternalBaseUrl(): string {
  const raw =
    process.env.LMS_AGENT_INTERNAL_URL?.trim() || "http://127.0.0.1:3607";
  return raw.replace(/\/$/, "");
}

/**
 * Load capability keys via Next `/api/privileges/capabilities`
 * (Next `unstable_cache` + LMS `/privileges/me/capabilities`).
 */
export async function fetchCapabilityKeys(
  lms: LmsToolContext,
): Promise<string[]> {
  const response = await fetch(
    `${agentInternalBaseUrl()}${withBasePath("/api/privileges/capabilities")}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${lms.token}`,
        Accept: "application/json",
        "x-lms-credential-id": lms.credentialId,
        ...(lms.role
          ? { "x-lms-role": lms.role, Role: lms.role }
          : {}),
      },
    },
  );

  const payload = (await response.json().catch(() => null)) as {
    keys?: string[];
    message?: string;
  } | null;

  if (!response.ok) {
    throw new Error(
      payload?.message ||
        `Unable to load privilege capabilities (${response.status}).`,
    );
  }

  if (!Array.isArray(payload?.keys)) {
    throw new Error("Privilege capabilities response was empty.");
  }

  return payload.keys.map(String);
}

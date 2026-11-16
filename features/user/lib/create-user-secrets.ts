import type { LmsAuth } from "@/lib/auth";
import { withBasePath } from "@/lib/base-path";

import {
  avatarFileFromParts,
  avatarPartsFromSecret,
} from "./avatar-from-secret";

function agentInternalBaseUrl(): string {
  const raw =
    process.env.LMS_AGENT_INTERNAL_URL?.trim() || "http://127.0.0.1:3607";
  return raw.replace(/\/$/, "");
}

function passwordFromSecrets(secrets: Record<string, string>): string {
  const direct = secrets.password ?? secrets.Password ?? "";
  if (direct) return direct;
  const first = Object.entries(secrets).find(([key]) => /password/i.test(key));
  return first?.[1] ?? "";
}

type SecretKind = "password" | "avatar";

async function takeSecretValues(
  secretId: string,
  auth: LmsAuth,
  kind: SecretKind,
): Promise<Record<string, string>> {
  const label = kind === "password" ? "Password" : "Profile photo";
  const response = await fetch(
    `${agentInternalBaseUrl()}${withBasePath("/api/agent/secrets/take")}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${auth.token}`,
        "Content-Type": "application/json",
        ...(auth.role ? { "x-lms-role": auth.role } : {}),
      },
      body: JSON.stringify({ secretId }),
    },
  );

  const payload = (await response.json().catch(() => null)) as {
    values?: Record<string, string>;
    message?: string;
    reason?: string;
  } | null;

  if (!response.ok) {
    const reason = payload?.reason;
    if (reason === "missing") {
      throw new Error(
        kind === "password"
          ? "Password secret was not found on the agent server. Re-submit the credentials form (do not reuse an old passwordSecretId)."
          : "Profile photo secret was not found on the agent server. Re-upload the image (do not reuse an old avatarSecretId).",
      );
    }
    if (reason === "expired") {
      throw new Error(
        `${label} secret has expired. Ask the user to re-enter it in the form.`,
      );
    }
    if (reason === "mismatch") {
      throw new Error(
        `${label} secret does not match the signed-in user. Re-authenticate and re-submit the form.`,
      );
    }
    throw new Error(
      payload?.message ||
        `Unable to unlock ${label.toLowerCase()} secret. Ask the user to re-enter it in the form.`,
    );
  }

  if (!payload?.values || typeof payload.values !== "object") {
    throw new Error(
      `${label} secret response was empty. Ask the user to re-enter it in the form.`,
    );
  }

  return payload.values;
}

/** One-time take of the credentials secret via Next API → password string. */
export async function takeCreateUserPassword(
  passwordSecretId: string,
  auth: LmsAuth,
): Promise<string> {
  const secrets = await takeSecretValues(passwordSecretId, auth, "password");
  const password = passwordFromSecrets(secrets);
  if (!password) {
    throw new Error(
      "Password secret is empty. Ask the user to re-enter credentials in the form.",
    );
  }
  return password;
}

/** One-time take of the avatar secret via Next API → File, or null when omitted. */
export async function takeCreateUserAvatar(
  avatarSecretId: string | undefined,
  auth: LmsAuth,
): Promise<File | null> {
  if (!avatarSecretId) return null;
  const secrets = await takeSecretValues(avatarSecretId, auth, "avatar");
  return avatarFileFromParts(avatarPartsFromSecret(secrets));
}

import { AgentSecretError } from "@/lib/tools/agent-secret-store";

import {
  assertAvatarByteLength,
  assertAvatarFilename,
} from "./avatar-constraints";

export type AvatarSecretParts = {
  base64: string;
  filename: string;
  mediaType: string;
};

/** Read avatar file parts from a one-time agent secret bag. */
export function avatarPartsFromSecret(
  secrets: Record<string, string>,
): AvatarSecretParts {
  const base64 =
    secrets.avatarBase64 ?? secrets.base64 ?? secrets.fileBase64 ?? "";
  const filename =
    secrets.avatarFilename ??
    secrets.filename ??
    secrets.fileFilename ??
    "avatar.png";
  const mediaType =
    secrets.avatarMediaType ??
    secrets.mediaType ??
    secrets.fileMediaType ??
    guessMediaType(filename);

  if (!base64) {
    throw new AgentSecretError("missing");
  }
  assertAvatarFilename(filename);
  assertAvatarByteLength(Math.floor((base64.length * 3) / 4));

  return { base64, filename, mediaType };
}

export function avatarFileFromParts(parts: AvatarSecretParts): File {
  const bytes = Buffer.from(parts.base64, "base64");
  assertAvatarByteLength(bytes.byteLength);
  return new File([bytes], parts.filename, {
    type: parts.mediaType || guessMediaType(parts.filename),
  });
}

function guessMediaType(filename: string): string {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".gif")) return "image/gif";
  if (lower.endsWith(".ico")) return "image/x-icon";
  if (lower.endsWith(".jfif")) return "image/jpeg";
  return "image/jpeg";
}

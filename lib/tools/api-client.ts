import type { LmsAuth } from "@/lib/auth";

import { lmsCredentials } from "./api-credential-store";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve, join } from "node:path";

export class LmsApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "LmsApiError";
    this.status = status;
  }
}

type QueryValue = string | number | boolean | null | undefined | unknown;

export type LmsFetchInit = {
  auth: LmsAuth;
  query?: Record<string, QueryValue>;
  body?: unknown;
} & Omit<RequestInit, "body">;

function backendBase(): string {
  const raw = process.env.LMS_BACKEND_URL?.trim();
  if (!raw) {
    throw new LmsApiError(500, "LMS_BACKEND_URL is not configured.");
  }
  return raw.replace(/\/$/, "");
}

function bearerFor(auth: LmsAuth): string {
  if (!auth.credentialId) return auth.token;
  if (!auth.principalId) {
    throw new LmsApiError(
      401,
      "LMS credential does not match the signed-in user.",
    );
  }
  return lmsCredentials.read(auth.credentialId, auth.principalId).token;
}

export async function lmsFetch<T>(
  path: string,
  init: LmsFetchInit,
): Promise<T> {
  const token = bearerFor(init.auth);
  const url = new URL(path.replace(/^\//, ""), `${backendBase()}/`);
  for (const [key, value] of Object.entries(init.query ?? {})) {
    if (value === undefined || value === null || value === "") continue;
    url.searchParams.set(key, String(value));
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
  };
  const fetchData: RequestInit = {
    method: init.method,
    headers,
  };
  if (init.auth.role) headers.Role = init.auth.role;
  if (init.body) {
    headers["Content-Type"] = "application/json";
    fetchData.body = JSON.stringify(init.body);
  }

  console.log("url", url.toString());
  console.log("headers", headers);
  console.log("body", init.body);

  const response = await fetch(url, fetchData);
  const json = (await response.json()) as {
    payload?: T;
    success?: boolean;
    errors?: Array<{ msg?: string; param?: string } | string>;
    message?: string;
  };

  const logsDir = resolve(process.cwd(), "logs");
  await mkdir(logsDir, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filePath = join(logsDir, `${timestamp}-response.json`);

  const pathReponse = {
    payload: json.payload,
    headers: headers,
    body: init.body,
    query: init.query,
    url: url.toString(),
    status: response.status,
    success: json.success,
    errors: json.errors,
  };
  await writeFile(filePath, JSON.stringify(pathReponse, null, 2), "utf8");

  if (json.success !== true) {
    const fromErrors = Array.isArray(json.errors)
      ? json.errors
          .map((e) => (typeof e === "string" ? e : e?.msg))
          .filter(Boolean)
          .join("; ")
      : undefined;
    throw new LmsApiError(
      response.status || 500,
      fromErrors || json.message || "LMS request failed",
    );
  }
  return json.payload as T;
}

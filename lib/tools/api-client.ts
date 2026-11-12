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

function buildUrl(path: string, query?: Record<string, QueryValue>): URL {
  const url = new URL(path.replace(/^\//, ""), `${backendBase()}/`);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value === undefined || value === null || value === "") continue;
    url.searchParams.set(key, String(value));
  }
  return url;
}

function authHeaders(auth: LmsAuth): Record<string, string> {
  const token = bearerFor(auth);
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
  };
  if (auth.role) headers.Role = auth.role;
  return headers;
}

async function parseLmsPayload<T>(
  response: Response,
  logContext?: {
    headers: Record<string, string>;
    body: unknown;
    query?: Record<string, QueryValue>;
    url: string;
  },
): Promise<T> {
  const json = (await response.json()) as {
    payload?: T;
    success?: boolean;
    errors?: Array<{ msg?: string; param?: string } | string>;
    message?: string;
  };

  if (logContext) {
    const logsDir = resolve(process.cwd(), "logs");
    await mkdir(logsDir, { recursive: true });
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filePath = join(logsDir, `${timestamp}-response.json`);
    const safeBody =
      logContext.body instanceof FormData
        ? "[multipart form-data]"
        : logContext.body;
    await writeFile(
      filePath,
      JSON.stringify(
        {
          payload: json.payload,
          headers: logContext.headers,
          body: safeBody,
          query: logContext.query,
          url: logContext.url,
          status: response.status,
          success: json.success,
          errors: json.errors,
        },
        null,
        2,
      ),
      "utf8",
    );
  }

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

export async function lmsFetch<T>(
  path: string,
  init: LmsFetchInit,
): Promise<T> {
  const url = buildUrl(path, init.query);
  const headers = authHeaders(init.auth);
  const fetchData: RequestInit = {
    method: init.method,
    headers,
  };
  if (init.body) {
    headers["Content-Type"] = "application/json";
    fetchData.body = JSON.stringify(init.body);
  }

  console.log("url", url.toString());
  console.log("headers", headers);
  console.log("body", init.body);

  const response = await fetch(url, fetchData);
  return parseLmsPayload<T>(response, {
    headers,
    body: init.body,
    query: init.query,
    url: url.toString(),
  });
}

export type LmsFetchFormInit = {
  auth: LmsAuth;
  query?: Record<string, QueryValue>;
  formData: FormData;
} & Omit<RequestInit, "body">;

/**
 * Multipart LMS request. Do not set Content-Type — the runtime adds the boundary.
 * Never log FormData field values (may include passwords).
 */
export async function lmsFetchForm<T>(
  path: string,
  init: LmsFetchFormInit,
): Promise<T> {
  const url = buildUrl(path, init.query);
  const headers = authHeaders(init.auth);
  const response = await fetch(url, {
    method: init.method ?? "POST",
    headers,
    body: init.formData,
  });
  return parseLmsPayload<T>(response, {
    headers,
    body: init.formData,
    query: init.query,
    url: url.toString(),
  });
}

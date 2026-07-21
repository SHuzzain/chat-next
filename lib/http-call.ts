import { ensureAbsoluteUrl } from "./utils";

/** LMS route wiring shared by agent MCP tools and widget-data resources. */
export type HttpCallDefinition = {
  endpoint: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  pathParams?: readonly string[];
  queryParams?: readonly string[];
  bodyParams?: readonly string[];
};

type HttpExecuteArgs = HttpCallDefinition & {
  token: string;
  origin: string;
  role?: string;
};

export function httpExecute({
  endpoint,
  method,
  token,
  origin,
  pathParams,
  queryParams,
  bodyParams,
  role,
}: HttpExecuteArgs) {
  return async (args: Record<string, unknown>) => {
    console.log("args: ", args);
    console.log("endpoint: ", endpoint);
    console.log("method: ", method);
    console.log("origin: ", origin);
    console.log("token: ", token ? "[REDACTED]" : "missing");
    console.log("pathParams: ", pathParams);
    console.log("queryParams: ", queryParams);
    console.log("bodyParams: ", bodyParams);

    const resolvedOrigin = ensureAbsoluteUrl(origin);
    let url = `${resolvedOrigin}${endpoint}`;

    console.log("resolved origin: ", resolvedOrigin);

    const query = new URLSearchParams();
    const body: Record<string, unknown> = {};

    /** -------- Path params -------- */
    if (pathParams) {
      for (const key of pathParams) {
        const value = args[key];

        if (value === undefined) {
          throw new Error(`Missing path param: ${key}`);
        }

        url = url.replace(`:${key}`, String(value));
      }
    }

    /** -------- Query params -------- */
    if (queryParams) {
      for (const key of queryParams) {
        const value = args[key];

        if (value !== undefined && value !== null) {
          query.append(key, String(value));
        }
      }
    }

    /** -------- Body params -------- */
    if (bodyParams) {
      for (const key of bodyParams) {
        if (Object.prototype.hasOwnProperty.call(args, key)) {
          body[key] = args[key];
        }
      }
    }

    if (query.size > 0) {
      url += `?${query.toString()}`;
    }

    console.log("final url: ", url);
    console.log("body: ", body);

    const requestInit: RequestInit = {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(role ? { Role: role } : {}),
      },
    };

    if (method !== "GET" && bodyParams) {
      requestInit.body = JSON.stringify(body);
    }

    const response = await fetch(url, requestInit);

    if (!response.ok) {
      const text = await response.text();
      console.log("text: ", text);
      throw new Error(text || response.statusText);
    }
    const result = await response.json();
    console.dir({ result }, { depth: null });

    return result;
  };
}


interface ToolDescriptionOptions {
  resourceName: string;
  purpose: string;
  searchableFields?: string[];
  supportedFilters?: string[];
  includedData?: string[];
  specificEntityToolName?: string;
  additionalInstructions?: string[];
}

export function createToolDescription({
  resourceName,
  purpose,
  searchableFields = [],
  supportedFilters = [],
  includedData = [],
  specificEntityToolName,
  additionalInstructions = [],
}: ToolDescriptionOptions): string {
  const description = [
    purpose,

    `Use this tool to retrieve a paginated list of ${resourceName}.`,

    searchableFields.length > 0
      ? `Use textSearch to search supported fields such as ${searchableFields.join(
          ", ",
        )}.`
      : undefined,

    supportedFilters.length > 0
      ? `Apply supported filters when requested: ${supportedFilters.join(", ")}.`
      : undefined,

    includedData.length > 0
      ? `The response can include ${includedData.join(", ")}.`
      : undefined,

    specificEntityToolName
      ? `For a report about one specific entity whose ID is unknown, resolve the entity first, then use ${specificEntityToolName}.`
      : undefined,

    "Request only the fields required to answer the user.",
    "For large result sets, render an async-table instead of listing all records in chat.",
    "Do not fetch every page through repeated model tool calls; let the frontend widget handle pagination, searching, filtering, and sorting.",

    ...additionalInstructions,
  ];

  return description.filter(Boolean).join(" ");
}
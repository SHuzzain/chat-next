import { trimToolResult, validateMongoIdArgs } from "./trim-tool-result";

const MONGO_ID_ARG_KEYS = [
  "id",
  "courseId",
  "course",
  "courseCentre",
  "user",
  "unit",
];

type HttpExecuteArgs = {
  endpoint: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  token: string;
  origin: string;
  role?: string;
  pathParams?: string[];
  queryParams?: string[];
  requiredParams?: string[];
};

function requiredParamHint(key: string, endpoint: string): string {
  if (key === "courseId" && endpoint.includes("liveclasses")) {
    return " Call learning.get_my_intakes (preferred for the user) or search_intake_by_name first to resolve the class/intake name to a MongoId.";
  }
  if (key === "id" && (endpoint.includes("get-course-units") || endpoint.includes("get-unit-complete-percent"))) {
    return " Use learning.get_my_intakes or search_intake_by_name (or get_course_units) to get the correct course/unit ID first.";
  }
  return "";
}

export function httpExecute({
  endpoint,
  method,
  token,
  origin,
  role,
  pathParams,
  queryParams,
  requiredParams,
}: HttpExecuteArgs) {
  return async (args: Record<string, unknown>) => {
    if (requiredParams) {
      for (const key of requiredParams) {
        const value = args[key];
        if (value === undefined || value === null || value === "") {
          return {
            error: true,
            message: `Missing required parameter: ${key}.${requiredParamHint(key, endpoint)}`,
            endpoint,
            argsUsed: args,
          };
        }
      }
    }

    const idValidationError = validateMongoIdArgs(
      args,
      MONGO_ID_ARG_KEYS,
      requiredParams
    );
    if (idValidationError) {
      return {
        error: true,
        message: idValidationError,
        endpoint,
        argsUsed: args,
      };
    }

    console.log("args: ", args);
    console.log("endpoint: ", endpoint);
    console.log("method: ", method);
    console.log("token: ", token);
    console.log("origin: ", origin);
    console.log("pathParams: ", pathParams);
    console.log("queryParams: ", queryParams);
    let url = `${origin}${endpoint}`;

    const query = new URLSearchParams();

    /** -------- Path params -------- */
    if (pathParams) {
      for (const key of pathParams) {
        const value = args[key];

        if (value === undefined) {
          return {
            error: true,
            message: `Missing required path parameter: ${key}`,
            argsUsed: args,
          };
        }

        url = url.replace(`:${key}`, String(value));
      }
    }

    /** -------- Query params -------- */
    if (queryParams) {
      for (const key of queryParams) {
        const value = args[key];

        if (
          value !== undefined &&
          value !== null &&
          String(value).trim() !== ""
        ) {
          query.append(key, String(value));
        }
      }
    }

    if (query.size > 0) {
      url += `?${query.toString()}`;
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
    if (role) {
      headers.Role = role;
    }

    const response = await fetch(url, {
      method,
      headers,
    });

    if (!response.ok) {
      const text = await response.text();
      const errorMsg = text || response.statusText;
      console.log("tool error: ", errorMsg);
      // Return structured error instead of throwing.
      // This lets the model see the failure and potentially recover (e.g. try lookup tool).
      return {
        error: true,
        message: errorMsg,
        status: response.status,
        endpoint,
        argsUsed: args,
      };
    }

    const result = await response.json();
    const trimmed = trimToolResult(result, endpoint);
    console.log("result: ", trimmed);

    return trimmed;
  };
}

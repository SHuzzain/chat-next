type HttpExecuteArgs = {
  endpoint: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  token: string;
  origin: string;
  pathParams?: string[];
  queryParams?: string[];
};

export function httpExecute({
  endpoint,
  method,
  token,
  origin,
  pathParams,
  queryParams,
}: HttpExecuteArgs) {
  return async (args: Record<string, unknown>) => {
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

    if (query.size > 0) {
      url += `?${query.toString()}`;
    }

    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || response.statusText);
    }
    const result = await response.json();
    console.log("result: ", result);

    return result;
  };
}

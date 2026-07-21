import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { httpExecute } from "@/lib/http-call";
import { normalizeProjectFields } from "@/lib/dynamic-widgets/normalize-project-fields";
import { widgetDataRequestSchema } from "@/lib/dynamic-widgets/schemas";
import { WIDGET_RESOURCES } from "@/mcptools/widget-resources";

class WidgetDataError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "WidgetDataError";
    this.status = status;
  }
}

async function readJsonBody(req: NextRequest): Promise<unknown> {
  const text = await req.text();
  if (!text.trim()) {
    throw new WidgetDataError("Request body is required", 400);
  }
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new WidgetDataError("Request body must be valid JSON", 400);
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = req.headers.get("authorization") || "";
    const token = auth.replace(/^Bearer\s+/i, "").trim();
    if (!token) {
      return NextResponse.json(
        { error: "Missing Authorization Bearer token" },
        { status: 401 },
      );
    }

    const json = await readJsonBody(req);
    if (!json || typeof json !== "object" || Array.isArray(json)) {
      return NextResponse.json(
        { error: "Request body must be a JSON object" },
        { status: 400 },
      );
    }

    const body = json as Record<string, unknown>;
    const headerOrigin = req.headers.get("x-lms-origin")?.trim();
    const parsed = widgetDataRequestSchema.safeParse({
      ...body,
      origin: body.origin || headerOrigin,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: z.treeifyError(parsed.error) },
        { status: 400 },
      );
    }

    const { resource: resourceName, origin: requestOrigin } = parsed.data;
    const resource = WIDGET_RESOURCES[resourceName];

    const origin =
      (requestOrigin || "").trim() ||
      (process.env.LMS_API_ORIGIN || "").trim();
    if (!origin) {
      return NextResponse.json(
        {
          error:
            "Missing LMS origin. Pass origin from embed searchParams or set LMS_API_ORIGIN.",
        },
        { status: 400 },
      );
    }

    const page = parsed.data.pagination?.page ?? 1;
    const pageSize = Math.min(
      Math.max(parsed.data.pagination?.pageSize ?? 20, 1),
      resource.maxPageSize,
    );

    // Trust widget/AI args — httpExecute only forwards keys listed on the resource.
    const args: Record<string, unknown> = {
      ...(parsed.data.pathParams ?? {}),
      ...(parsed.data.params ?? {}),
      ...(parsed.data.body ?? {}),
      page,
      rowPerPage: pageSize,
    };

    if (parsed.data.search) {
      args.textSearch = parsed.data.search;
    }
    if (parsed.data.sort) {
      args.order = parsed.data.sort.field;
      args.orderBy = parsed.data.sort.direction;
    }
    if (parsed.data.select?.length) {
      args.advanceFilterSelect = normalizeProjectFields(parsed.data.select);
    }

    const execute = httpExecute({
      endpoint: resource.endpoint,
      method: resource.method,
      token,
      origin,
      pathParams: [...resource.pathParams],
      queryParams: [...resource.queryParams],
      bodyParams: [...resource.bodyParams],
    });

    const raw = await execute(args);
    return NextResponse.json(resource.mapResponse(raw, page, pageSize));
  } catch (error) {
    if (error instanceof WidgetDataError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    console.error("[widget-data]", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 502 },
    );
  }
}

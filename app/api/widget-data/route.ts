import { NextRequest, NextResponse } from "next/server";

async function readJsonBody(req: NextRequest): Promise<unknown> {
  const text = await req.text();
  if (!text.trim()) {
    return NextResponse.json(
      { error: "Request body is required" },
      { status: 400 },
    );
  }
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON" },
      { status: 400 },
    );
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
    const parsed = {
      ...body,
      origin: body.origin || headerOrigin || "",
    };

    console.log({ parsed });

    const origin = (parsed.origin as string)?.trim() || "";
    if (!origin) {
      return NextResponse.json(
        {
          error:
            "Missing LMS origin. Pass origin from embed searchParams or set LMS_API_ORIGIN.",
        },
        { status: 400 },
      );
    }

    return NextResponse.json({ data: "mock data" }, { status: 200 });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }
}

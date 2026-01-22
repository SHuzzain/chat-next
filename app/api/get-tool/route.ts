import { backendResponseSchema } from "@/schema/tools";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = req.nextUrl;
        const origin = searchParams.get("origin");
        const token = searchParams.get("token");
        if (!origin || !token) {
            return NextResponse.json({ error: "Origin and token are required" }, { status: 400 });
        }
        const response = await fetch(`${origin}/mcp-tools/config`, {
            headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
            return NextResponse.json({ success: false, error: response.statusText }, { status: response.status });
        }
        const schema = await response.json() as { payload: z.infer<typeof backendResponseSchema>, success: boolean };


        const { success, data, error } = backendResponseSchema.safeParse(schema.payload);

        if (!success) {
            return NextResponse.json({ success: false, error: error.message }, { status: 400 });
        }


        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error(error);

        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}
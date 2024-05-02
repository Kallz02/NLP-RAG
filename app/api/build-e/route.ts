import { NextRequest, NextResponse } from "next/server";
import built from "@/utils/built";
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    await built(body.repo);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.status ?? 500 });
  }
}

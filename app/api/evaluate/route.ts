import { NextRequest, NextResponse } from "next/server";

function resolveEvaluateUrl(): string {
  const configured =
    process.env.NEXT_PUBLIC_API_URL_AI_EXAM ??
    process.env.API_URL_AI_EXAM ??
    "";
  if (!configured) {
    throw new Error("Missing NEXT_PUBLIC_API_URL_AI_EXAM");
  }
  if (configured.endsWith("/api/evaluate")) {
    return configured;
  }
  return `${configured.replace(/\/$/, "")}/api/evaluate`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const upstream = await fetch(resolveEvaluateUrl(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body,
    });

    const text = await upstream.text();
    let json: unknown;
    try {
      json = JSON.parse(text);
    } catch {
      return NextResponse.json(
        { message: text || "Invalid response from evaluate service" },
        { status: upstream.ok ? 502 : upstream.status }
      );
    }

    return NextResponse.json(json, { status: upstream.status });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Evaluate proxy failed";
    return NextResponse.json({ message }, { status: 500 });
  }
}

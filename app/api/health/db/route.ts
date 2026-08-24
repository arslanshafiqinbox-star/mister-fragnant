import { NextResponse } from "next/server";
import { getDb, getMongoUriDiagnostics } from "@/lib/mongodb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/health/db — diagnose Atlas connectivity on Vercel without leaking secrets.
 */
export async function GET() {
  const diagnostics = getMongoUriDiagnostics();

  if (!diagnostics.present) {
    return NextResponse.json(
      {
        ok: false,
        stage: "env",
        message: "MONGODB_URI is not set in this environment",
        diagnostics,
      },
      { status: 500 }
    );
  }

  try {
    const db = await getDb();
    const ping = await db.command({ ping: 1 });
    return NextResponse.json({
      ok: true,
      stage: "ping",
      ping,
      diagnostics,
    });
  } catch (e) {
    const err = e as Error & { code?: string | number; cause?: Error };
    const causeMessage =
      err.cause instanceof Error ? err.cause.message : undefined;

    const hint =
      /alert number 80|TLSV1_ALERT_INTERNAL_ERROR|ssl3_read_bytes/i.test(
        err.message + (causeMessage ?? "")
      )
        ? [
            "Atlas aborted the TLS handshake (alert 80). This is almost never a bad password — Atlas does that when your IP is not allowed.",
            "Fix: MongoDB Atlas → Network Access → Add IP Address → Allow Access from Anywhere → 0.0.0.0/0 → Confirm.",
            "Wait 1–2 minutes, then reload this URL. Also confirm the cluster is not Paused (Atlas → Database).",
            "Optional: set Vercel MONGODB_URI to the mongodb+srv:// string from Atlas Connect → Drivers, and URL-encode special password characters.",
          ].join(" ")
        : undefined;

    return NextResponse.json(
      {
        ok: false,
        stage: "connect",
        message: err.message,
        cause: causeMessage,
        name: err.name,
        code: err.code,
        hint,
        diagnostics,
      },
      { status: 500 }
    );
  }
}

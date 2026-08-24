import { NextRequest, NextResponse } from "next/server";

const ADMIN_EMAIL = "mk0906145@gmail.com";
const ADMIN_PASSWORD = "Mazhar@123";
const ADMIN_TOKEN = "23771459-36031363-42942554-97706434";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
    };

    const email = body.email?.trim().toLowerCase() ?? "";
    const password = body.password ?? "";

    if (!email || !password) {
      return NextResponse.json(
        { ok: false, message: "Email and password are required." },
        { status: 400 }
      );
    }

    if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
      return NextResponse.json(
        { ok: false, message: "Invalid email or password." },
        { status: 401 }
      );
    }

    return NextResponse.json({
      ok: true,
      token: ADMIN_TOKEN,
      email: ADMIN_EMAIL,
    });
  } catch {
    return NextResponse.json(
      { ok: false, message: "Unable to sign in." },
      { status: 500 }
    );
  }
}

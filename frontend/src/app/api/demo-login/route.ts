import { NextResponse } from "next/server";

// This is a cosmetic demo gate, not production authentication.
export async function POST(request: Request) {
  const configuredPassword = process.env.DEMO_PASSWORD;

  if (!configuredPassword) {
    return NextResponse.json({ error: "Demo password is not configured on the server." }, { status: 503 });
  }

  const body = (await request.json()) as { username?: string; password?: string };
  const username = body.username?.trim();

  if (!username || body.password !== configuredPassword) {
    return NextResponse.json({ error: "Incorrect demo password." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set("demo-session", "authenticated", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 8,
    path: "/",
  });
  return response;
}
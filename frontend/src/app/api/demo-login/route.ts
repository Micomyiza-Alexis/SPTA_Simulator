import { NextResponse } from "next/server";

// This is a cosmetic demo gate, not production authentication.
export async function POST(request: Request) {
  const body = (await request.json()) as { username?: string; password?: string };
  const username = body.username?.trim();
  const backendUrl = process.env.BACKEND_API_URL?.replace(/\/$/, "");

  if (backendUrl) {
    const backendResponse = await fetch(`${backendUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password: body.password }),
      cache: "no-store",
    });

    if (!backendResponse.ok) {
      const result = (await backendResponse.json()) as { detail?: string };
      return NextResponse.json(
        { error: result.detail ?? "Unable to sign in to the demo." },
        { status: backendResponse.status },
      );
    }
  } else {
    const configuredPassword = process.env.DEMO_PASSWORD;

    if (!configuredPassword) {
      return NextResponse.json({ error: "Demo password is not configured on the server." }, { status: 503 });
    }

    if (!username || body.password !== configuredPassword) {
      return NextResponse.json({ error: "Incorrect demo password." }, { status: 401 });
    }
  }

  if (!username) {
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
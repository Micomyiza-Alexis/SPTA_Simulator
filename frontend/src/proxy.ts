import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Cosmetic demo gate for the hackathon prototype, not production
// authentication. Redirects to /login when the demo-session cookie
// (set by /api/demo-login) is missing.
export function proxy(request: NextRequest) {
  const hasSession = request.cookies.has("demo-session");

  if (!hasSession) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!login|api|_next/static|_next/image|favicon.ico|NISR LOGO.png).*)",
  ],
};
import { NextRequest, NextResponse } from "next/server";

const protectedPaths = ["/", "/simulator", "/households", "/scenarios"];

export function proxy(request: NextRequest) {
  const isProtected = protectedPaths.some(
    (path) => request.nextUrl.pathname === path || request.nextUrl.pathname.startsWith(`${path}/`),
  );

  if (isProtected && request.cookies.get("demo-session")?.value !== "authenticated") {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/simulator/:path*", "/households/:path*", "/scenarios/:path*"],
};
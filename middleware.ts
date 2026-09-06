import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAME, isSessionValid } from "@/lib/auth";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Let the login page, its API route, and the separately-gated admin
  // section through untouched.
  if (
    pathname === "/login" ||
    pathname.startsWith("/api/login") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api/admin")
  ) {
    return NextResponse.next();
  }

  const secret = process.env.COOKIE_SECRET;
  if (!secret) {
    // Mis-configured deployment — fail closed rather than open.
    return new NextResponse("Server is missing COOKIE_SECRET.", { status: 500 });
  }

  const cookie = req.cookies.get(COOKIE_NAME)?.value;
  const valid = await isSessionValid(secret, cookie);

  if (!valid) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Run on everything except static assets/Next internals.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

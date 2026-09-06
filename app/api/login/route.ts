import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAME, createSessionCookieValue } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const secret = process.env.COOKIE_SECRET;
  const appPassword = process.env.APP_PASSWORD;
  if (!secret || !appPassword) {
    return NextResponse.json(
      { error: "Server is missing APP_PASSWORD or COOKIE_SECRET." },
      { status: 500 }
    );
  }

  const { password } = await req.json();
  if (password !== appPassword) {
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  }

  const cookieValue = await createSessionCookieValue(secret);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, cookieValue, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60,
  });
  return res;
}

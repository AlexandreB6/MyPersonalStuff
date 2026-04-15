/**
 * Next 16 proxy (formerly middleware): in demo mode, ensures every visitor
 * gets a `demo_session` cookie before any server component runs. Server
 * components can't mutate cookies at render time, so we set it here on the
 * first request.
 */

import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "demo_session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

export function proxy(req: NextRequest) {
  if (process.env.DEMO_MODE !== "true") return NextResponse.next();

  if (req.cookies.get(COOKIE_NAME)) return NextResponse.next();

  const sid = crypto.randomUUID();
  const res = NextResponse.next();
  res.cookies.set(COOKIE_NAME, sid, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });
  // Also expose to the outgoing request so RSCs in this same pass read it.
  req.cookies.set(COOKIE_NAME, sid);
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

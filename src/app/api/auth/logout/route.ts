/**
 * Route API : /api/auth/logout
 * Efface le cookie `owner_session`.
 */

import { NextRequest, NextResponse } from "next/server";
import { clearOwnerCookie } from "@/lib/owner";

export async function POST(req: NextRequest) {
  await clearOwnerCookie();
  return NextResponse.redirect(new URL("/", req.url), { status: 303 });
}

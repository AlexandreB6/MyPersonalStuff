/**
 * Route API : /api/auth/login
 * Vérifie le mot de passe owner et pose le cookie `owner_session`.
 * Désactivée en mode démo (les visiteurs écrivent librement dans leur sandbox).
 */

import { NextRequest, NextResponse } from "next/server";
import { isDemoMode } from "@/lib/demo";
import { setOwnerCookie, verifyOwnerPassword } from "@/lib/owner";

export async function POST(req: NextRequest) {
  if (isDemoMode()) {
    return NextResponse.json({ error: "Disabled in demo mode" }, { status: 404 });
  }
  if (!process.env.OWNER_PASSWORD) {
    return NextResponse.json({ error: "Owner gate not configured" }, { status: 404 });
  }

  let body: { password?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const password = typeof body.password === "string" ? body.password : "";
  if (!verifyOwnerPassword(password)) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  await setOwnerCookie();
  return NextResponse.json({ ok: true });
}

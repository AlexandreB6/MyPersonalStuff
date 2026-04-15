/**
 * Route API : /api/demo/reset
 * Purge toutes les données de la sandbox démo du visiteur courant et efface
 * son cookie, forçant la création d'une nouvelle session au prochain hit.
 */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { isDemoMode } from "@/lib/demo";

const COOKIE_NAME = "demo_session";

export async function POST() {
  if (!isDemoMode()) {
    return NextResponse.json({ error: "Not in demo mode" }, { status: 404 });
  }

  const jar = await cookies();
  const sid = jar.get(COOKIE_NAME)?.value;
  if (!sid) return NextResponse.json({ ok: true, cleared: 0 });

  const [movies, mangas, paints] = await Promise.all([
    prisma.movie.deleteMany({ where: { demoSessionId: sid } }),
    prisma.manga.deleteMany({ where: { demoSessionId: sid } }),
    prisma.ownedPaint.deleteMany({ where: { demoSessionId: sid } }),
  ]);

  jar.delete(COOKIE_NAME);

  return NextResponse.json({
    ok: true,
    cleared: movies.count + mangas.count + paints.count,
  });
}

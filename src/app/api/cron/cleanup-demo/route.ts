/**
 * Route API : /api/cron/cleanup-demo
 * Déclenchée par Vercel Cron (voir vercel.json). Supprime les lignes démo
 * (demoSessionId IS NOT NULL) plus anciennes que 24h. Ne touche jamais le seed.
 *
 * Vercel injecte automatiquement un header Authorization: Bearer ${CRON_SECRET}
 * quand CRON_SECRET est défini dans les variables d'environnement du projet.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isDemoMode } from "@/lib/demo";

const RETENTION_HOURS = 24;

export async function GET(req: NextRequest) {
  if (!isDemoMode()) {
    return NextResponse.json({ skipped: "not in demo mode" });
  }

  const auth = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - RETENTION_HOURS * 60 * 60 * 1000);
  const whereStale = { demoSessionId: { not: null }, createdAt: { lt: cutoff } };

  const [movies, mangas, paints] = await Promise.all([
    prisma.movie.deleteMany({ where: whereStale }),
    prisma.manga.deleteMany({ where: whereStale }),
    prisma.ownedPaint.deleteMany({ where: whereStale }),
  ]);

  return NextResponse.json({
    ok: true,
    cutoff: cutoff.toISOString(),
    deleted: { movies: movies.count, mangas: mangas.count, paints: paints.count },
  });
}

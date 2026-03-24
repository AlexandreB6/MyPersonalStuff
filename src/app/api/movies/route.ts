/**
 * Route API : /api/movies
 * CRUD pour la collection de films vus.
 */

import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

/** Liste tous les films de la collection. */
export async function GET() {
  const movies = await prisma.movie.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(movies);
}

/** Ajoute un film vu (upsert sur tmdbId). */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { tmdbId, title, posterPath, overview, director, releaseYear, rating, watchedAt, watchedPrecision } = body;

  if (!tmdbId || !title) {
    return NextResponse.json({ error: "tmdbId and title required" }, { status: 400 });
  }

  const precision = watchedPrecision === "year" ? "year" : "day";

  const movie = await prisma.movie.upsert({
    where: { tmdbId },
    create: {
      tmdbId,
      title,
      posterPath: posterPath ?? null,
      overview: overview ?? null,
      director: director ?? null,
      releaseYear: releaseYear ?? null,
      rating: rating != null ? Number(rating) : null,
      watchedAt: watchedAt ? new Date(watchedAt) : null,
      watchedPrecision: precision,
    },
    update: {
      rating: rating != null ? Number(rating) : null,
      watchedAt: watchedAt ? new Date(watchedAt) : undefined,
      watchedPrecision: precision,
    },
  });
  revalidatePath("/cinema");
  return NextResponse.json(movie);
}

/** Met à jour un film (rating, owned, watchedAt). */
export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { tmdbId, rating, owned, ownedFormat, watchedAt, watchedPrecision } = body;

  if (!tmdbId) {
    return NextResponse.json({ error: "tmdbId required" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (rating !== undefined) data.rating = rating != null ? Number(rating) : null;
  if (owned !== undefined) data.owned = owned;
  if (ownedFormat !== undefined) data.ownedFormat = ownedFormat;
  if (watchedAt !== undefined) data.watchedAt = watchedAt ? new Date(watchedAt) : null;
  if (watchedPrecision !== undefined) data.watchedPrecision = watchedPrecision === "year" ? "year" : "day";

  const movie = await prisma.movie.update({ where: { tmdbId }, data });
  revalidatePath("/cinema");
  return NextResponse.json(movie);
}

/** Supprime un film de la collection. */
export async function DELETE(req: NextRequest) {
  const { tmdbId } = await req.json();
  if (!tmdbId) {
    return NextResponse.json({ error: "tmdbId required" }, { status: 400 });
  }
  await prisma.movie.delete({ where: { tmdbId } });
  revalidatePath("/cinema");
  return NextResponse.json({ ok: true });
}

/**
 * Seed script for the demo Neon project.
 *
 * Creates a small baseline of films / mangas / paints visible to every demo
 * visitor (demoSessionId = NULL). Idempotent: uses deleteMany on NULL rows
 * then createMany so re-runs produce the same state. Does NOT touch any row
 * with a non-null demoSessionId (visitor sandboxes).
 *
 * Run against the DEMO database only:
 *   DATABASE_URL=<demo-url> npx tsx prisma/seed.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding demo baseline…");

  // Nuke any existing seed rows (NULL demoSessionId), keep visitor sandboxes.
  await prisma.movie.deleteMany({ where: { demoSessionId: null } });
  await prisma.manga.deleteMany({ where: { demoSessionId: null } });
  await prisma.ownedPaint.deleteMany({ where: { demoSessionId: null } });

  await prisma.movie.createMany({
    data: [
      // posterPath left null: TMDB poster paths change and the fallback in
      // MovieCard is neutral. The detail page re-fetches the real poster from
      // TMDB on click regardless of what's stored here.
      {
        tmdbId: 27205,
        title: "Inception",
        posterPath: null,
        overview: null,
        director: "Christopher Nolan",
        releaseYear: 2010,
        rating: 4.5,
        watchedAt: new Date("2023-06-15"),
        watchedPrecision: "day",
      },
      {
        tmdbId: 496243,
        title: "Parasite",
        posterPath: null,
        overview: null,
        director: "Bong Joon-ho",
        releaseYear: 2019,
        rating: 5,
        watchedAt: new Date("2022-11-02"),
        watchedPrecision: "day",
      },
      {
        tmdbId: 129,
        title: "Le Voyage de Chihiro",
        posterPath: null,
        overview: null,
        director: "Hayao Miyazaki",
        releaseYear: 2001,
        rating: 5,
        watchedAt: new Date("2020-01-01"),
        watchedPrecision: "year",
      },
      {
        tmdbId: 155,
        title: "The Dark Knight",
        posterPath: null,
        overview: null,
        director: "Christopher Nolan",
        releaseYear: 2008,
        rating: 4.5,
        watchedAt: new Date("2021-08-20"),
        watchedPrecision: "day",
      },
      {
        tmdbId: 438631,
        title: "Dune",
        posterPath: null,
        overview: null,
        director: "Denis Villeneuve",
        releaseYear: 2021,
        rating: 4,
        watchedAt: new Date("2021-10-12"),
        watchedPrecision: "day",
      },
    ],
  });

  await prisma.manga.createMany({
    data: [
      // coverImage left null on purpose: MAL CDN paths rot / change and a
      // broken <img> on a portfolio looks worse than the neutral fallback
      // rendered by MangaCard when coverImage is null. The detail page
      // (/manga/[slug]) hydrates the real cover via Jikan on click anyway.
      {
        malId: 2,
        title: "Berserk",
        author: "Kentaro Miura",
        volumes: 42,
        demographic: "Seinen",
        status: "Finished",
        score: 9.47,
        ownedVolumesMap: JSON.stringify([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]),
        coverImage: null,
      },
      {
        malId: 13,
        title: "One Piece",
        author: "Eiichiro Oda",
        volumes: null,
        demographic: "Shounen",
        status: "Publishing",
        score: 9.22,
        ownedVolumesMap: JSON.stringify([1, 2, 3, 4, 5]),
        coverImage: null,
      },
      {
        malId: 502,
        title: "Vinland Saga",
        author: "Makoto Yukimura",
        volumes: null,
        demographic: "Seinen",
        status: "Publishing",
        score: 9.0,
        ownedVolumesMap: JSON.stringify([1, 2, 3]),
        coverImage: null,
      },
      {
        malId: 1,
        title: "Monster",
        author: "Naoki Urasawa",
        volumes: 18,
        demographic: "Seinen",
        status: "Finished",
        score: 9.15,
        ownedVolumesMap: JSON.stringify([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18]),
        coverImage: null,
      },
    ],
  });

  await prisma.ownedPaint.createMany({
    data: [
      { paintId: "abaddon-black", range: "citadel", quantity: 2 },
      { paintId: "mephiston-red", range: "citadel", quantity: 1 },
      { paintId: "caliban-green", range: "citadel", quantity: 1 },
      { paintId: "macragge-blue", range: "citadel", quantity: 1 },
      { paintId: "leadbelcher", range: "citadel", quantity: 1 },
      { paintId: "retributor-armour", range: "citadel", quantity: 1 },
      { paintId: "nuln-oil", range: "citadel", quantity: 3 },
      { paintId: "agrax-earthshade", range: "citadel", quantity: 2 },
    ],
  });

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

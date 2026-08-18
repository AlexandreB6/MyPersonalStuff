/**
 * Seed de la base de démo de l'app Manga.
 *
 * Crée la base commune visible par tous les visiteurs de la démo
 * (demoSessionId = NULL). Idempotent : deleteMany sur les lignes NULL puis
 * createMany, donc rejouable. Ne touche jamais une ligne au demoSessionId
 * non nul (sandbox d'un visiteur).
 *
 * À lancer uniquement contre la base de DÉMO :
 *   DATABASE_URL=<url-demo> npx tsx prisma/seed.ts
 */

import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Manga demo baseline…");

  // Efface les lignes de seed (demoSessionId NULL), garde les sandboxes.
  await prisma.manga.deleteMany({ where: { demoSessionId: null } });

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

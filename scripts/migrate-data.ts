/**
 * Migration ponctuelle : recopie les données de l'ancienne base unique
 * (les 3 tables ensemble) vers les 3 bases dédiées, une par app.
 *
 *   OLD_DATABASE_URL=... \
 *   CINEMA_DATABASE_URL=... MANGA_DATABASE_URL=... PEINTURE_DATABASE_URL=... \
 *   npx tsx scripts/migrate-data.ts [--dry-run]
 *
 * Les nouvelles bases doivent déjà porter leur migration `0_init`
 * (`cd apps/<app> && npx prisma migrate deploy`).
 *
 * Les identifiants sont conservés, puis les séquences sont recalées sur le
 * max(id) — sans quoi le prochain insert entrerait en collision.
 * Le script est rejouable : il refuse d'écrire dans une table non vide.
 *
 * À supprimer une fois la bascule validée.
 */

import { PrismaClient as CinemaClient } from "../apps/cinema/src/generated/prisma";
import { PrismaClient as MangaClient } from "../apps/manga/src/generated/prisma";
import { PrismaClient as PeintureClient } from "../apps/peinture/src/generated/prisma";

const DRY_RUN = process.argv.includes("--dry-run");

function url(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Variable d'environnement manquante : ${name}`);
  return value;
}

const OLD = url("OLD_DATABASE_URL");

/**
 * En dry-run les destinations ne sont jamais interrogées : on ne réclame pas
 * leurs URLs, pour pouvoir compter les lignes avant même de créer les bases.
 */
function targetUrl(name: string): string {
  return DRY_RUN ? OLD : url(name);
}

function connect<T>(Ctor: new (opts: object) => T, target: string): T {
  return new Ctor({ datasources: { db: { url: target } } });
}

async function migrate<Row extends { id: number }>(
  label: string,
  table: string,
  source: { findMany: () => Promise<Row[]> },
  dest: {
    count: () => Promise<number>;
    createMany: (args: { data: Row[] }) => Promise<{ count: number }>;
  },
  resetSequence: (sql: string) => Promise<unknown>,
): Promise<void> {
  const rows = await source.findMany();

  // En dry-run on ne touche pas la destination : elle peut ne pas exister encore.
  if (DRY_RUN) {
    console.log(`${label} : ${rows.length} ligne(s) à copier (dry-run).`);
    return;
  }

  const existing = await dest.count();
  if (existing > 0) {
    console.log(`${label} : ${existing} ligne(s) déjà présentes — ignoré.`);
    return;
  }

  const { count } = await dest.createMany({ data: rows });
  await resetSequence(
    `SELECT setval(pg_get_serial_sequence('"${table}"', 'id'), COALESCE((SELECT MAX(id) FROM "${table}"), 1))`,
  );
  console.log(`${label} : ${count} ligne(s) copiée(s).`);
}

async function main() {
  const sources = {
    cinema: connect(CinemaClient, OLD),
    manga: connect(MangaClient, OLD),
    peinture: connect(PeintureClient, OLD),
  };
  const targets = {
    cinema: connect(CinemaClient, targetUrl("CINEMA_DATABASE_URL")),
    manga: connect(MangaClient, targetUrl("MANGA_DATABASE_URL")),
    peinture: connect(PeintureClient, targetUrl("PEINTURE_DATABASE_URL")),
  };

  try {
    await migrate("Movie", "Movie", sources.cinema.movie, targets.cinema.movie, (sql) =>
      targets.cinema.$executeRawUnsafe(sql),
    );
    await migrate("Manga", "Manga", sources.manga.manga, targets.manga.manga, (sql) =>
      targets.manga.$executeRawUnsafe(sql),
    );
    await migrate(
      "OwnedPaint",
      "OwnedPaint",
      sources.peinture.ownedPaint,
      targets.peinture.ownedPaint,
      (sql) => targets.peinture.$executeRawUnsafe(sql),
    );
  } finally {
    await Promise.all(
      [...Object.values(sources), ...Object.values(targets)].map((c) => c.$disconnect()),
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

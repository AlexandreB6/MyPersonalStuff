import { prisma } from "@/lib/prisma";
import { MangaClient } from "@/components/manga/MangaClient";
import { demoFilter, dedupBySid } from "@/lib/demo";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Manga — MyPersonalStuff",
  description: "Collection personnelle de mangas",
};

/** Vérifie si l'API Jikan est accessible (timeout court). */
async function checkJikanHealth(): Promise<boolean> {
  try {
    const res = await fetch("https://api.jikan.moe/v4/manga?q=test&limit=1", {
      signal: AbortSignal.timeout(5000),
      cache: "no-store",
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Page Manga — charge la collection depuis la DB
 * et passe les données au client component MangaClient.
 */
export default async function MangaPage() {
  const where = await demoFilter();
  const [mangasRaw, jikanUp] = await Promise.all([
    prisma.manga.findMany({ where, orderBy: { title: "asc" } }),
    checkJikanHealth(),
  ]);
  const mangas = dedupBySid(mangasRaw, (m) => m.malId);

  const serialized = mangas.map((m) => ({
    ...m,
    ownedVolumesMap: JSON.parse(m.ownedVolumesMap) as number[],
    createdAt: m.createdAt.toISOString(),
    updatedAt: m.updatedAt.toISOString(),
  }));

  return <MangaClient initialMangas={serialized} jikanAvailable={jikanUp} />;
}

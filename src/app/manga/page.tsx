import { prisma } from "@/lib/prisma";
import { MangaClient } from "@/components/manga/MangaClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Manga — MyPersonalStuff",
  description: "Collection personnelle de mangas",
};

/**
 * Page Manga — charge la collection depuis la DB
 * et passe les données au client component MangaClient.
 */
export default async function MangaPage() {
  const mangas = await prisma.manga.findMany({ orderBy: { title: "asc" } });

  const serialized = mangas.map((m) => ({
    ...m,
    ownedVolumesMap: JSON.parse(m.ownedVolumesMap) as number[],
    createdAt: m.createdAt.toISOString(),
    updatedAt: m.updatedAt.toISOString(),
  }));

  return <MangaClient initialMangas={serialized} />;
}

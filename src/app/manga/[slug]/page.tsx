export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { extractMalIdFromSlug, getMangaById, getAuthor, formatGenres } from "@/lib/jikan";
import { MangaDetailClient } from "@/components/manga/MangaDetailClient";
import type { MangaItem } from "@/components/manga/MangaCard";

interface Props {
  params: Promise<{ slug: string }>;
}

/** Charge le manga depuis la DB, ou depuis Jikan si absent de la collection. */
async function loadManga(malId: number): Promise<{ manga: MangaItem; isInCollection: boolean }> {
  const dbManga = await prisma.manga.findUnique({ where: { malId } });

  if (dbManga) {
    return {
      manga: {
        ...dbManga,
        ownedVolumesMap: JSON.parse(dbManga.ownedVolumesMap) as number[],
        createdAt: dbManga.createdAt.toISOString(),
        updatedAt: dbManga.updatedAt.toISOString(),
      },
      isInCollection: true,
    };
  }

  // Pas en DB → charger depuis Jikan
  const jikan = await getMangaById(malId);
  return {
    manga: {
      id: 0,
      malId: jikan.mal_id,
      title: jikan.title,
      titleJapanese: jikan.title_japanese,
      coverImage: jikan.images?.jpg?.large_image_url ?? jikan.images?.jpg?.image_url ?? null,
      author: getAuthor(jikan),
      volumes: jikan.volumes,
      chapters: jikan.chapters,
      synopsis: jikan.synopsis,
      genres: formatGenres(jikan) || null,
      demographic: jikan.demographics?.[0]?.name ?? null,
      score: jikan.score,
      status: jikan.status,
      ownedVolumesMap: [],
      notes: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    isInCollection: false,
  };
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const malId = extractMalIdFromSlug(slug);
  try {
    const { manga } = await loadManga(malId);
    return {
      title: `${manga.title} — Manga — MyPersonalStuff`,
      description: manga.synopsis?.slice(0, 160) ?? `Fiche manga : ${manga.title}`,
    };
  } catch {
    return {};
  }
}

export default async function MangaDetailPage({ params }: Props) {
  const { slug } = await params;
  const malId = extractMalIdFromSlug(slug);

  let manga: MangaItem;
  let isInCollection: boolean;
  try {
    ({ manga, isInCollection } = await loadManga(malId));
  } catch {
    notFound();
  }

  return <MangaDetailClient manga={manga} isInCollection={isInCollection} />;
}

export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { extractIdFromSlug } from "@/lib/utils";
import { MangaDetailClient } from "@/components/manga/MangaDetailClient";
import type { MangaItem } from "@/components/manga/MangaCard";

interface Props {
  params: Promise<{ slug: string }>;
}

async function loadManga(id: number): Promise<MangaItem | null> {
  const dbManga = await prisma.manga.findUnique({ where: { id } });
  if (!dbManga) return null;
  return {
    ...dbManga,
    ownedVolumesMap: JSON.parse(dbManga.ownedVolumesMap) as number[],
    createdAt: dbManga.createdAt.toISOString(),
    updatedAt: dbManga.updatedAt.toISOString(),
  };
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  try {
    const id = extractIdFromSlug(slug);
    const manga = await loadManga(id);
    if (!manga) return {};
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
  let id: number;
  try {
    id = extractIdFromSlug(slug);
  } catch {
    notFound();
  }

  const manga = await loadManga(id);
  if (!manga) notFound();

  return <MangaDetailClient manga={manga} isInCollection={true} />;
}

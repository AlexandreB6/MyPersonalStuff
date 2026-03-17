export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { extractMalIdFromSlug } from "@/lib/jikan";
import { MangaDetailClient } from "@/components/manga/MangaDetailClient";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const malId = extractMalIdFromSlug(slug);
  const manga = await prisma.manga.findUnique({ where: { malId } });
  if (!manga) return {};
  return {
    title: `${manga.title} — Manga — MyPersonalStuff`,
    description: manga.synopsis?.slice(0, 160) ?? `Fiche manga : ${manga.title}`,
  };
}

export default async function MangaDetailPage({ params }: Props) {
  const { slug } = await params;
  const malId = extractMalIdFromSlug(slug);
  const manga = await prisma.manga.findUnique({ where: { malId } });
  if (!manga) notFound();

  const serialized = {
    ...manga,
    ownedVolumesMap: JSON.parse(manga.ownedVolumesMap) as number[],
    createdAt: manga.createdAt.toISOString(),
    updatedAt: manga.updatedAt.toISOString(),
  };

  return <MangaDetailClient manga={serialized} />;
}

export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { getVolumeById } from "@/lib/google-books";
import { MangaDetailClient } from "@/components/manga/MangaDetailClient";
import type { MangaItem } from "@/components/manga/MangaCard";

interface Props {
  params: Promise<{ gbId: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { gbId } = await params;
  const series = await getVolumeById(gbId);
  if (!series) return {};
  return {
    title: `${series.title} — Manga — MyPersonalStuff`,
    description: series.synopsis?.slice(0, 160) ?? `Fiche manga : ${series.title}`,
  };
}

export default async function MangaPreviewPage({ params }: Props) {
  const { gbId } = await params;
  const series = await getVolumeById(gbId);
  if (!series) notFound();

  const manga: MangaItem = {
    id: 0,
    googleBooksId: series.googleBooksId,
    title: series.title,
    titleJapanese: null,
    coverImage: series.coverImage,
    author: series.author,
    publisher: series.publisher,
    editionLabel: series.editionLabel,
    volumes: series.volumeCount > 0 ? series.volumeCount : null,
    synopsis: series.synopsis,
    genres: null,
    demographic: null,
    status: null,
    source: "google-books",
    ownedVolumesMap: [],
    notes: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return <MangaDetailClient manga={manga} isInCollection={false} />;
}

/**
 * Route API : /api/manga
 * CRUD pour la collection de mangas.
 */

import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

/** Liste tous les mangas de la collection. */
export async function GET() {
  const mangas = await prisma.manga.findMany({ orderBy: { title: "asc" } });
  return NextResponse.json(mangas);
}

/** Ajoute un manga à la collection (upsert sur malId). */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { malId, title, titleJapanese, coverImage, author, volumes, chapters, synopsis, genres, demographic, score, status } = body;

  if (!malId || !title) {
    return NextResponse.json({ error: "malId and title required" }, { status: 400 });
  }

  const manga = await prisma.manga.upsert({
    where: { malId },
    create: { malId, title, titleJapanese, coverImage, author, volumes, chapters, synopsis, genres, demographic, score, status },
    update: { title, titleJapanese, coverImage, author, volumes, chapters, synopsis, genres, demographic, score, status },
  });
  revalidatePath("/manga");
  revalidatePath("/");
  return NextResponse.json(manga);
}

/** Met à jour ownedVolumesMap et/ou notes d'un manga. */
export async function PUT(req: NextRequest) {
  const { malId, ownedVolumesMap, notes } = await req.json();
  if (!malId) {
    return NextResponse.json({ error: "malId required" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (ownedVolumesMap !== undefined) data.ownedVolumesMap = JSON.stringify(ownedVolumesMap);
  if (notes !== undefined) data.notes = notes;

  const manga = await prisma.manga.update({
    where: { malId },
    data,
  });
  revalidatePath("/manga");
  revalidatePath("/");
  return NextResponse.json(manga);
}

/** Supprime un manga de la collection. */
export async function DELETE(req: NextRequest) {
  const { malId } = await req.json();
  if (!malId) {
    return NextResponse.json({ error: "malId required" }, { status: 400 });
  }
  await prisma.manga.delete({ where: { malId } });
  revalidatePath("/manga");
  revalidatePath("/");
  return NextResponse.json({ ok: true });
}

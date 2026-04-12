/**
 * Route API : /api/manga
 * CRUD pour la collection de mangas (éditions françaises).
 */

import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

/** Liste tous les mangas de la collection. */
export async function GET() {
  const mangas = await prisma.manga.findMany({ orderBy: { title: "asc" } });
  return NextResponse.json(mangas);
}

/** Ajoute un manga à la collection. Upsert basé sur googleBooksId si présent, sinon sur (title, publisher, editionLabel). */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    googleBooksId,
    title,
    titleJapanese,
    coverImage,
    author,
    publisher,
    editionLabel,
    volumes,
    synopsis,
    genres,
    demographic,
    status,
    source,
  } = body;

  if (!title) {
    return NextResponse.json({ error: "title required" }, { status: 400 });
  }

  const data = {
    googleBooksId: googleBooksId ?? null,
    title,
    titleJapanese,
    coverImage,
    author,
    publisher: publisher ?? null,
    editionLabel: editionLabel ?? null,
    volumes,
    synopsis,
    genres,
    demographic,
    status,
    source: source ?? "google-books",
  };

  const manga = googleBooksId
    ? await prisma.manga.upsert({
        where: { googleBooksId },
        create: data,
        update: data,
      })
    : await prisma.manga.upsert({
        where: {
          title_publisher_editionLabel: {
            title,
            publisher: publisher ?? null,
            editionLabel: editionLabel ?? null,
          },
        },
        create: data,
        update: data,
      });

  revalidatePath("/manga");
  revalidatePath("/");
  return NextResponse.json(manga);
}

/** Met à jour ownedVolumesMap et/ou notes d'un manga (par id interne). */
export async function PUT(req: NextRequest) {
  const { id, ownedVolumesMap, notes } = await req.json();
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (ownedVolumesMap !== undefined) data.ownedVolumesMap = JSON.stringify(ownedVolumesMap);
  if (notes !== undefined) data.notes = notes;

  const manga = await prisma.manga.update({
    where: { id },
    data,
  });
  revalidatePath("/manga");
  revalidatePath("/");
  return NextResponse.json(manga);
}

/** Supprime un manga de la collection (par id interne). */
export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }
  await prisma.manga.delete({ where: { id } });
  revalidatePath("/manga");
  revalidatePath("/");
  return NextResponse.json({ ok: true });
}

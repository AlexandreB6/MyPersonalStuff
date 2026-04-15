/**
 * Route API : /api/manga
 * CRUD pour la collection de mangas.
 * Demo mode: writes are scoped per visitor via demoSessionId cookie.
 */

import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  assertDemoOwnership,
  demoFilter,
  demoWriteData,
  DemoForbiddenError,
} from "@/lib/demo";
import { ownerGateResponse } from "@/lib/owner";

/** Liste tous les mangas visibles pour la session courante. */
export async function GET() {
  const filter = await demoFilter();
  const mangas = await prisma.manga.findMany({
    where: filter,
    orderBy: { title: "asc" },
  });
  return NextResponse.json(mangas);
}

/** Ajoute un manga à la collection (upsert scoped par demoSessionId). */
export async function POST(req: NextRequest) {
  const gate = await ownerGateResponse();
  if (gate) return gate;
  const body = await req.json();
  const { malId, title, titleJapanese, coverImage, author, volumes, chapters, synopsis, genres, demographic, score, status } = body;

  if (!malId || !title) {
    return NextResponse.json({ error: "malId and title required" }, { status: 400 });
  }

  const { demoSessionId } = await demoWriteData();
  const existing = await prisma.manga.findFirst({ where: { malId, demoSessionId } });

  const payload = { malId, title, titleJapanese, coverImage, author, volumes, chapters, synopsis, genres, demographic, score, status };

  const manga = existing
    ? await prisma.manga.update({ where: { id: existing.id }, data: payload })
    : await prisma.manga.create({ data: { ...payload, demoSessionId } });

  revalidatePath("/manga");
  revalidatePath("/");
  return NextResponse.json(manga);
}

/** Met à jour ownedVolumesMap et/ou notes d'un manga. */
export async function PUT(req: NextRequest) {
  const gate = await ownerGateResponse();
  if (gate) return gate;
  const { malId, ownedVolumesMap, notes } = await req.json();
  if (!malId) {
    return NextResponse.json({ error: "malId required" }, { status: 400 });
  }

  const filter = await demoFilter();
  const existing = await prisma.manga.findFirst({ where: { malId, ...filter } });
  if (!existing) {
    return NextResponse.json({ error: "Manga not found" }, { status: 404 });
  }

  try {
    await assertDemoOwnership(existing.demoSessionId, "manga");
  } catch (e) {
    if (e instanceof DemoForbiddenError) {
      return NextResponse.json({ error: e.message }, { status: 403 });
    }
    throw e;
  }

  const data: Record<string, unknown> = {};
  if (ownedVolumesMap !== undefined) data.ownedVolumesMap = JSON.stringify(ownedVolumesMap);
  if (notes !== undefined) data.notes = notes;

  const manga = await prisma.manga.update({ where: { id: existing.id }, data });
  revalidatePath("/manga");
  revalidatePath("/");
  return NextResponse.json(manga);
}

/** Supprime un manga de la collection. */
export async function DELETE(req: NextRequest) {
  const gate = await ownerGateResponse();
  if (gate) return gate;
  const { malId } = await req.json();
  if (!malId) {
    return NextResponse.json({ error: "malId required" }, { status: 400 });
  }

  const filter = await demoFilter();
  const existing = await prisma.manga.findFirst({ where: { malId, ...filter } });
  if (!existing) {
    return NextResponse.json({ error: "Manga not found" }, { status: 404 });
  }

  try {
    await assertDemoOwnership(existing.demoSessionId, "manga");
  } catch (e) {
    if (e instanceof DemoForbiddenError) {
      return NextResponse.json({ error: e.message }, { status: 403 });
    }
    throw e;
  }

  await prisma.manga.delete({ where: { id: existing.id } });
  revalidatePath("/manga");
  revalidatePath("/");
  return NextResponse.json({ ok: true });
}

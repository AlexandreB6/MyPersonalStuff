/**
 * Route API : /api/paints
 * CRUD pour les peintures possédées (OwnedPaint).
 * Persistance via Prisma/SQLite.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** Liste toutes les peintures possédées. */
export async function GET() {
  const paints = await prisma.ownedPaint.findMany();
  return NextResponse.json(paints);
}

/** Ajoute une peinture à l'inventaire (upsert pour éviter les doublons). */
export async function POST(req: NextRequest) {
  const { paintId, quantity = 1 } = await req.json();
  if (!paintId) {
    return NextResponse.json({ error: "paintId required" }, { status: 400 });
  }
  const paint = await prisma.ownedPaint.upsert({
    where: { paintId },
    create: { paintId, quantity },
    update: { quantity },
  });
  return NextResponse.json(paint);
}

/** Met à jour la quantité et/ou les notes d'une peinture possédée. */
export async function PUT(req: NextRequest) {
  const { paintId, quantity, notes } = await req.json();
  if (!paintId) {
    return NextResponse.json({ error: "paintId required" }, { status: 400 });
  }
  const data: Record<string, unknown> = {};
  if (quantity !== undefined) data.quantity = quantity;
  if (notes !== undefined) data.notes = notes;

  const paint = await prisma.ownedPaint.update({
    where: { paintId },
    data,
  });
  return NextResponse.json(paint);
}

/** Supprime une peinture de l'inventaire. */
export async function DELETE(req: NextRequest) {
  const { paintId } = await req.json();
  if (!paintId) {
    return NextResponse.json({ error: "paintId required" }, { status: 400 });
  }
  await prisma.ownedPaint.delete({ where: { paintId } });
  return NextResponse.json({ ok: true });
}

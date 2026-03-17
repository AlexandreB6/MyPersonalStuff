/**
 * Route API : /api/paints
 * CRUD pour les peintures possédées (OwnedPaint).
 * Supporte le champ `range` pour distinguer les gammes.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** Liste les peintures possédées, filtrées par range optionnelle. */
export async function GET(req: NextRequest) {
  const range = req.nextUrl.searchParams.get("range");
  const where = range ? { range } : {};
  const paints = await prisma.ownedPaint.findMany({ where });
  return NextResponse.json(paints);
}

/** Ajoute une peinture à l'inventaire (upsert sur paintId+range). */
export async function POST(req: NextRequest) {
  const { paintId, range = "citadel", quantity = 1 } = await req.json();
  if (!paintId) {
    return NextResponse.json({ error: "paintId required" }, { status: 400 });
  }
  const paint = await prisma.ownedPaint.upsert({
    where: { paintId_range: { paintId, range } },
    create: { paintId, range, quantity },
    update: { quantity },
  });
  return NextResponse.json(paint);
}

/** Met à jour la quantité et/ou les notes d'une peinture possédée. */
export async function PUT(req: NextRequest) {
  const { paintId, range = "citadel", quantity, notes } = await req.json();
  if (!paintId) {
    return NextResponse.json({ error: "paintId required" }, { status: 400 });
  }
  const data: Record<string, unknown> = {};
  if (quantity !== undefined) data.quantity = quantity;
  if (notes !== undefined) data.notes = notes;

  const paint = await prisma.ownedPaint.update({
    where: { paintId_range: { paintId, range } },
    data,
  });
  return NextResponse.json(paint);
}

/** Supprime une peinture de l'inventaire. */
export async function DELETE(req: NextRequest) {
  const { paintId, range = "citadel" } = await req.json();
  if (!paintId) {
    return NextResponse.json({ error: "paintId required" }, { status: 400 });
  }
  await prisma.ownedPaint.delete({
    where: { paintId_range: { paintId, range } },
  });
  return NextResponse.json({ ok: true });
}

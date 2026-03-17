import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { RANGE_MAP } from "@/data/paint-ranges";
import { PeintureClient } from "@/components/peinture/PeintureClient";

interface Props {
  params: Promise<{ range: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { range: rangeSlug } = await params;
  const range = RANGE_MAP.get(rangeSlug);
  if (!range) return {};
  return {
    title: `${range.name} — Peinture — MyPersonalStuff`,
    description: range.description,
  };
}

export default async function PeintureRangePage({ params }: Props) {
  const { range: rangeSlug } = await params;
  const range = RANGE_MAP.get(rangeSlug);
  if (!range) notFound();

  const ownedPaints = await prisma.ownedPaint.findMany({
    where: { range: rangeSlug },
  });

  const owned = ownedPaints.map((p) => ({
    paintId: p.paintId,
    quantity: p.quantity,
    notes: p.notes,
  }));

  return (
    <PeintureClient
      initialOwned={owned}
      paints={range.paints}
      paintTypes={range.paintTypes}
      typeColors={range.typeColors}
      rangeSlug={range.slug}
      rangeName={range.name}
    />
  );
}

import { prisma } from "@/lib/prisma";
import { PeintureClient } from "@/components/peinture/PeintureClient";

export const metadata = {
  title: "Peinture — MyPersonalStuff",
  description: "Inventaire de peintures Citadel",
};

/**
 * Page Peinture — charge les peintures possédées depuis la DB
 * et passe les données au client component PeintureClient.
 */
export default async function PeinturePage() {
  const ownedPaints = await prisma.ownedPaint.findMany();

  const owned = ownedPaints.map((p) => ({
    paintId: p.paintId,
    quantity: p.quantity,
    notes: p.notes,
  }));

  return <PeintureClient initialOwned={owned} />;
}

"use client";

import { useCallback } from "react";
import { cn } from "@/lib/utils";

interface VolumeGridProps {
  totalVolumes: number | null;
  ownedVolumes: number[];
  onToggle: (volume: number) => void;
}

/**
 * Grille de volumes cliquables pour un manga.
 * Chaque case représente un volume — vert si possédé, gris sinon.
 */
export function VolumeGrid({ totalVolumes, ownedVolumes, onToggle }: VolumeGridProps) {
  const ownedSet = new Set(ownedVolumes);
  // Nombre total de cases à afficher : soit le total connu, soit le max des volumes possédés
  const count = totalVolumes ?? Math.max(0, ...ownedVolumes, 0);

  const handleToggle = useCallback(
    (vol: number) => {
      onToggle(vol);
    },
    [onToggle],
  );

  if (count === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nombre de volumes inconnu. Ajoutez des volumes via le bouton ci-dessous.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {Array.from({ length: count }, (_, i) => i + 1).map((vol) => {
          const owned = ownedSet.has(vol);
          return (
            <button
              key={vol}
              onClick={() => handleToggle(vol)}
              title={`Volume ${vol} — ${owned ? "possédé" : "manquant"}`}
              aria-label={`Volume ${vol}, ${owned ? "possédé" : "manquant"}`}
              aria-pressed={owned}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-md text-xs font-semibold transition-all cursor-pointer",
                owned
                  ? "bg-primary text-primary-foreground shadow-sm shadow-primary/25 hover:bg-primary/80"
                  : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground",
              )}
            >
              {vol}
            </button>
          );
        })}
      </div>

      {/* Légende */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm bg-primary" />
          Possédé
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm bg-muted" />
          Manquant
        </span>
      </div>
    </div>
  );
}

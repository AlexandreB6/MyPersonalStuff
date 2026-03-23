"use client";

import { useState } from "react";
import { Star, StarHalf, X } from "lucide-react";
import type { MovieCardData } from "./MovieCard";

interface MarkWatchedDialogProps {
  movie: MovieCardData | null;
  onClose: () => void;
  onConfirm: (tmdbId: number, rating: number | null, watchedAt: string | null) => Promise<void>;
}

/**
 * Dialog pour marquer un film comme vu — note demi-étoiles (optionnelle) + date optionnelle.
 */
export function MarkWatchedDialog({ movie, onClose, onConfirm }: MarkWatchedDialogProps) {
  const [rating, setRating] = useState<number | null>(null);
  const [hoverRating, setHoverRating] = useState(0);
  const [watchedAt, setWatchedAt] = useState("");
  const [saving, setSaving] = useState(false);

  if (!movie) return null;

  const handleConfirm = async () => {
    setSaving(true);
    try {
      await onConfirm(movie.tmdbId, rating, watchedAt || null);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const displayRating = hoverRating || rating || 0;

  /** Calcule la note selon la position du clic/hover dans l'étoile */
  const getRatingFromEvent = (e: React.MouseEvent<HTMLButtonElement>, starIndex: number) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const isLeftHalf = x < rect.width / 2;
    return isLeftHalf ? starIndex - 0.5 : starIndex;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          aria-label="Fermer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with mini poster */}
        <div className="flex items-start gap-4">
          {movie.posterPath && (
            <img
              src={`https://image.tmdb.org/t/p/w154${movie.posterPath}`}
              alt=""
              className="w-16 h-24 rounded-lg object-cover flex-shrink-0"
            />
          )}
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold leading-tight line-clamp-2">Marquer comme vu</h2>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{movie.title}</p>
          </div>
        </div>

        {/* Half-star rating (optional) */}
        <div>
          <label className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
            Note personnelle <span className="text-muted-foreground/50 font-normal">(optionnel)</span>
            {rating != null && (
              <span className="text-amber-400 font-bold">{rating}/5</span>
            )}
          </label>
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((n) => {
              const filled = displayRating >= n;
              const halfFilled = !filled && displayRating >= n - 0.5;
              return (
                <button
                  key={n}
                  onClick={(e) => {
                    const val = getRatingFromEvent(e, n);
                    setRating(rating === val ? null : val);
                  }}
                  onMouseMove={(e) => setHoverRating(getRatingFromEvent(e, n))}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-0.5 transition-transform hover:scale-110 cursor-pointer relative"
                  aria-label={`${n} étoile${n > 1 ? "s" : ""}`}
                >
                  {halfFilled ? (
                    <div className="relative w-8 h-8">
                      <Star className="w-8 h-8 text-muted-foreground/30 absolute inset-0" />
                      <StarHalf className="w-8 h-8 fill-amber-400 text-amber-400 absolute inset-0" />
                    </div>
                  ) : (
                    <Star
                      className={`w-8 h-8 transition-colors ${
                        filled
                          ? "fill-amber-400 text-amber-400"
                          : "text-muted-foreground/30"
                      }`}
                    />
                  )}
                </button>
              );
            })}
            {rating != null && (
              <button
                onClick={() => setRating(null)}
                className="ml-2 text-xs text-muted-foreground hover:text-white transition-colors cursor-pointer"
              >
                Effacer
              </button>
            )}
          </div>
        </div>

        {/* Date (optional) */}
        <div>
          <label htmlFor="watched-date" className="text-sm font-medium text-muted-foreground mb-2 block">
            Date de visionnage <span className="text-muted-foreground/50 font-normal">(optionnel)</span>
          </label>
          <input
            id="watched-date"
            type="date"
            value={watchedAt}
            onChange={(e) => setWatchedAt(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-medium hover:bg-muted/50 transition-colors cursor-pointer"
          >
            Annuler
          </button>
          <button
            onClick={handleConfirm}
            disabled={saving}
            className="flex-1 rounded-lg bg-green-600 hover:bg-green-500 text-white px-4 py-2.5 text-sm font-bold transition-colors disabled:opacity-50 cursor-pointer"
          >
            {saving ? "Enregistrement…" : "Confirmer"}
          </button>
        </div>
      </div>
    </div>
  );
}

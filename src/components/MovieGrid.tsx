"use client";

import { useState, useCallback } from "react";
import { MovieCard, type MovieCardData } from "./MovieCard";
import { Loader2 } from "lucide-react";

/** Props pour la grille de films avec pagination infinie */
interface MovieGridProps {
  initialMovies: MovieCardData[];
  initialPage: number;
  totalPages: number;
}

/**
 * Grille de films avec chargement incrémental.
 * Les nouveaux films chargés sont annoncés via aria-live.
 */
export function MovieGrid({ initialMovies, initialPage, totalPages }: MovieGridProps) {
  const [movies, setMovies] = useState(initialMovies);
  const [page, setPage] = useState(initialPage);
  const [loading, setLoading] = useState(false);
  const hasMore = page < totalPages;

  /** Charge la page suivante de films depuis l'API */
  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      const nextPage = page + 1;
      const res = await fetch(`/api/now-playing?page=${nextPage}`);
      const data = await res.json();
      setMovies((prev) => [...prev, ...data.movies]);
      setPage(nextPage);
    } finally {
      setLoading(false);
    }
  }, [page, loading, hasMore]);

  return (
    <>
      {/* aria-live annonce les nouveaux films chargés, aria-atomic="false" évite de relire tout le contenu */}
      <div
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5"
        aria-live="polite"
        aria-atomic="false"
      >
        {movies.map((movie) => (
          <MovieCard key={movie.id} {...movie} />
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center pt-8 pb-4">
          <button
            onClick={loadMore}
            disabled={loading}
            className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-white/5 border border-white/10 text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white hover:border-white/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                Chargement…
              </>
            ) : (
              "Voir plus de films"
            )}
          </button>
        </div>
      )}
    </>
  );
}

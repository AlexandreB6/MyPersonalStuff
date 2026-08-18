"use client";

import { MovieCard, type MovieCardData } from "./MovieCard";
import { Loader2 } from "lucide-react";

interface MovieGridProps {
  movies: MovieCardData[];
  loading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  onMarkWatched?: (movie: MovieCardData) => void;
}

/**
 * Grille de films — composant "dumb", reçoit les données et callbacks du parent.
 */
export function MovieGrid({ movies, loading, hasMore, onLoadMore, onMarkWatched }: MovieGridProps) {
  return (
    <>
      <div
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5"
        aria-live="polite"
        aria-atomic="false"
      >
        {movies.map((movie) => (
          <MovieCard key={movie.tmdbId} {...movie} onMarkWatched={onMarkWatched} />
        ))}
      </div>

      {movies.length === 0 && !loading && (
        <p className="text-center text-muted-foreground py-12">Aucun film trouvé</p>
      )}

      {hasMore && onLoadMore && (
        <div className="flex justify-center pt-8 pb-4">
          <button
            onClick={onLoadMore}
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

      {loading && movies.length === 0 && (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      )}
    </>
  );
}

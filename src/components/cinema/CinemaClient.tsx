"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Search, RotateCcw, Loader2, Eye, Star, StarHalf, ChevronDown } from "lucide-react";
import { MovieGrid } from "./MovieGrid";
import { MarkWatchedDialog } from "./MarkWatchedDialog";
import type { MovieCardData } from "./MovieCard";
import type { TmdbGenre } from "@/lib/tmdb";

interface WatchedMovie {
  tmdbId: number;
  title: string;
  posterPath: string | null;
  director: string | null;
  releaseYear: number | null;
  rating: number | null;
  watchedAt: string | null;
  overview: string | null;
}

interface CinemaClientProps {
  initialMovies: MovieCardData[];
  initialTotalPages: number;
  genres: TmdbGenre[];
  watchedTmdbIds: number[];
  watchedMovies: WatchedMovie[];
}

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: CURRENT_YEAR - 1980 + 1 }, (_, i) => CURRENT_YEAR - i);
const DURATION_PRESETS = [
  { label: "< 1h30", min: 0, max: 90 },
  { label: "1h30-2h", min: 90, max: 120 },
  { label: "2h-2h30", min: 120, max: 150 },
  { label: "> 2h30", min: 150, max: 0 },
];
const RATING_OPTIONS = [5, 6, 7, 8, 9];
const SORT_OPTIONS = [
  { value: "popularity.desc", label: "Popularité" },
  { value: "vote_average.desc", label: "Note" },
  { value: "primary_release_date.desc", label: "Date" },
  { value: "title.asc", label: "Titre" },
];

export function CinemaClient({
  initialMovies,
  initialTotalPages,
  genres,
  watchedTmdbIds: initialWatchedIds,
  watchedMovies: initialWatchedMovies,
}: CinemaClientProps) {
  // Tabs
  const [activeTab, setActiveTab] = useState<"explore" | "collection">("explore");

  // Explorer state
  const [movies, setMovies] = useState<MovieCardData[]>(initialMovies);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null);
  const [selectedMinRating, setSelectedMinRating] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState("primary_release_date.desc");

  // Watched state
  const [watchedIds, setWatchedIds] = useState<Set<number>>(new Set(initialWatchedIds));
  const [watchedMovies, setWatchedMovies] = useState<WatchedMovie[]>(initialWatchedMovies);
  const [dialogMovie, setDialogMovie] = useState<MovieCardData | null>(null);

  // Collection filter
  const [collectionSearch, setCollectionSearch] = useState("");
  const [collectionRatingFilter, setCollectionRatingFilter] = useState<number | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const isSearchMode = activeQuery.trim().length > 0;

  // Build query params for discover API
  const buildParams = useCallback(
    (p: number, query?: string) => {
      const params = new URLSearchParams({ page: String(p) });
      if (query?.trim()) {
        params.set("query", query);
      } else {
        if (selectedYear) params.set("year", String(selectedYear));
        if (selectedGenres.length) params.set("genres", selectedGenres.join(","));
        if (selectedDuration !== null) {
          const preset = DURATION_PRESETS[selectedDuration];
          if (preset.min) params.set("runtimeMin", String(preset.min));
          if (preset.max) params.set("runtimeMax", String(preset.max));
        }
        if (selectedMinRating) params.set("minRating", String(selectedMinRating));
        if (sortBy !== "popularity.desc") params.set("sortBy", sortBy);
      }
      return params;
    },
    [selectedYear, selectedGenres, selectedDuration, selectedMinRating, sortBy]
  );

  // Fetch movies
  const fetchMovies = useCallback(
    async (p: number, append: boolean, query?: string) => {
      setLoading(true);
      try {
        const params = buildParams(p, query);
        const res = await fetch(`/api/discover?${params}`);
        const data = await res.json();
        const enriched: MovieCardData[] = data.movies.map((m: MovieCardData) => ({
          ...m,
          watched: watchedIds.has(m.tmdbId),
        }));
        if (append) {
          setMovies((prev) => [...prev, ...enriched]);
        } else {
          setMovies(enriched);
        }
        setPage(p);
        setTotalPages(data.totalPages);
      } finally {
        setLoading(false);
      }
    },
    [buildParams, watchedIds]
  );

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setActiveQuery(searchQuery);
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [searchQuery]);

  // Re-fetch when filters or active query change
  const isInitialRender = useRef(true);
  useEffect(() => {
    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }
    fetchMovies(1, false, activeQuery || undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear, selectedGenres, selectedDuration, selectedMinRating, sortBy, activeQuery]);

  // Update watched badges when watchedIds changes
  useEffect(() => {
    setMovies((prev) =>
      prev.map((m) => ({ ...m, watched: watchedIds.has(m.tmdbId) }))
    );
  }, [watchedIds]);

  const loadMore = useCallback(() => {
    fetchMovies(page + 1, true, activeQuery || undefined);
  }, [fetchMovies, page, activeQuery]);

  const resetFilters = () => {
    setSearchQuery("");
    setActiveQuery("");
    setSelectedYear(null);
    setSelectedGenres([]);
    setSelectedDuration(null);
    setSelectedMinRating(null);
    setSortBy("primary_release_date.desc");
  };

  const toggleGenre = (id: number) => {
    setSelectedGenres((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  };

  const hasActiveFilters = selectedYear || selectedGenres.length || selectedDuration !== null || selectedMinRating || sortBy !== "primary_release_date.desc" || activeQuery;

  // Mark watched handler
  const handleMarkWatched = async (tmdbId: number, rating: number | null, watchedAt: string | null) => {
    const movie = movies.find((m) => m.tmdbId === tmdbId);
    if (!movie) return;

    const res = await fetch("/api/movies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tmdbId,
        title: movie.title,
        posterPath: movie.posterPath,
        overview: movie.overview,
        director: movie.director,
        releaseYear: movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : null,
        rating,
        watchedAt: watchedAt || null,
      }),
    });

    if (res.ok) {
      setWatchedIds((prev) => new Set([...prev, tmdbId]));
      const saved = await res.json();
      setWatchedMovies((prev) => [
        {
          tmdbId: saved.tmdbId,
          title: saved.title,
          posterPath: saved.posterPath,
          director: saved.director,
          releaseYear: saved.releaseYear,
          rating: saved.rating,
          watchedAt: saved.watchedAt,
          overview: saved.overview,
        },
        ...prev.filter((m) => m.tmdbId !== tmdbId),
      ]);
    }
  };

  // Remove from collection
  const handleRemoveWatched = async (tmdbId: number) => {
    const res = await fetch("/api/movies", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tmdbId }),
    });
    if (res.ok) {
      setWatchedIds((prev) => {
        const next = new Set(prev);
        next.delete(tmdbId);
        return next;
      });
      setWatchedMovies((prev) => prev.filter((m) => m.tmdbId !== tmdbId));
    }
  };

  // Filtered collection
  const filteredCollection = watchedMovies.filter((m) => {
    if (collectionSearch && !m.title.toLowerCase().includes(collectionSearch.toLowerCase())) return false;
    if (collectionRatingFilter && (m.rating ?? 0) < collectionRatingFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-1 bg-white/5 rounded-xl p-1 w-fit">
        <button
          onClick={() => setActiveTab("explore")}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
            activeTab === "explore"
              ? "bg-white/10 text-white shadow-sm"
              : "text-muted-foreground hover:text-white"
          }`}
        >
          Explorer
        </button>
        <button
          onClick={() => setActiveTab("collection")}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "collection"
              ? "bg-white/10 text-white shadow-sm"
              : "text-muted-foreground hover:text-white"
          }`}
        >
          <Eye className="w-4 h-4" aria-hidden="true" />
          Ma collection
          {watchedIds.size > 0 && (
            <span className="text-xs bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded-full">
              {watchedIds.size}
            </span>
          )}
        </button>
      </div>

      {/* Explorer tab */}
      {activeTab === "explore" && (
        <div className="space-y-6">
          {/* Search bar */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <input
              type="text"
              placeholder="Rechercher un film…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-border bg-background pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground/50"
            />
          </div>

          {/* Filters — hidden during search mode */}
          {!isSearchMode && (
            <div className="flex flex-wrap items-center gap-2">
              {/* Year */}
              <div className="relative">
                <select
                  value={selectedYear ?? ""}
                  onChange={(e) => setSelectedYear(e.target.value ? Number(e.target.value) : null)}
                  className={`appearance-none rounded-full pl-3 pr-7 py-1.5 text-xs font-medium border transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                    selectedYear
                      ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                      : "bg-white/5 text-muted-foreground border-transparent hover:text-white"
                  }`}
                >
                  <option value="" className="bg-neutral-900 text-white">Année</option>
                  {YEAR_OPTIONS.map((y) => (
                    <option key={y} value={y} className="bg-neutral-900 text-white">{y}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none text-muted-foreground" aria-hidden="true" />
              </div>

              {/* Genre — multi-toggle */}
              <div className="relative">
                <select
                  value=""
                  onChange={(e) => {
                    if (!e.target.value) { setSelectedGenres([]); return; }
                    toggleGenre(Number(e.target.value));
                  }}
                  className={`appearance-none rounded-full pl-3 pr-7 py-1.5 text-xs font-medium border transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                    selectedGenres.length
                      ? "bg-violet-500/20 text-violet-400 border-violet-500/30"
                      : "bg-white/5 text-muted-foreground border-transparent hover:text-white"
                  }`}
                >
                  <option value="" disabled hidden className="bg-neutral-900 text-white">
                    {selectedGenres.length
                      ? `${selectedGenres.length} genre${selectedGenres.length > 1 ? "s" : ""}`
                      : "Genre"}
                  </option>
                  <option value="" className="bg-neutral-900 text-white">Tous les genres</option>
                  {genres.map((g) => (
                    <option key={g.id} value={g.id} className="bg-neutral-900 text-white">
                      {selectedGenres.includes(g.id) ? "✓ " : "  "}{g.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none text-muted-foreground" aria-hidden="true" />
              </div>

              {/* Duration */}
              <div className="relative">
                <select
                  value={selectedDuration !== null ? String(selectedDuration) : ""}
                  onChange={(e) => setSelectedDuration(e.target.value ? Number(e.target.value) : null)}
                  className={`appearance-none rounded-full pl-3 pr-7 py-1.5 text-xs font-medium border transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                    selectedDuration !== null
                      ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                      : "bg-white/5 text-muted-foreground border-transparent hover:text-white"
                  }`}
                >
                  <option value="" className="bg-neutral-900 text-white">Durée</option>
                  {DURATION_PRESETS.map((d, i) => (
                    <option key={i} value={i} className="bg-neutral-900 text-white">{d.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none text-muted-foreground" aria-hidden="true" />
              </div>

              {/* Min rating */}
              <div className="relative">
                <select
                  value={selectedMinRating ?? ""}
                  onChange={(e) => setSelectedMinRating(e.target.value ? Number(e.target.value) : null)}
                  className={`appearance-none rounded-full pl-3 pr-7 py-1.5 text-xs font-medium border transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                    selectedMinRating
                      ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                      : "bg-white/5 text-muted-foreground border-transparent hover:text-white"
                  }`}
                >
                  <option value="" className="bg-neutral-900 text-white">Note min.</option>
                  {RATING_OPTIONS.map((r) => (
                    <option key={r} value={r} className="bg-neutral-900 text-white">{r}+ / 10</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none text-muted-foreground" aria-hidden="true" />
              </div>

              {/* Sort */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="appearance-none rounded-full pl-3 pr-7 py-1.5 text-xs font-medium bg-white/5 text-muted-foreground border border-transparent hover:text-white transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value} className="bg-neutral-900 text-white">{o.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none text-muted-foreground" aria-hidden="true" />
              </div>

              {/* Reset */}
              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs text-muted-foreground hover:text-white transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" aria-hidden="true" />
                  Reset
                </button>
              )}
            </div>
          )}

          {isSearchMode && (
            <p className="text-sm text-muted-foreground">
              Résultats pour &ldquo;{activeQuery}&rdquo;
              <button onClick={resetFilters} className="ml-2 text-primary hover:underline text-xs cursor-pointer">Effacer</button>
            </p>
          )}

          {/* Movie grid */}
          <MovieGrid
            movies={movies}
            loading={loading}
            hasMore={page < totalPages}
            onLoadMore={loadMore}
            onMarkWatched={(movie) => setDialogMovie(movie)}
          />
        </div>
      )}

      {/* Collection tab */}
      {activeTab === "collection" && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative max-w-xs flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
              <input
                type="text"
                placeholder="Filtrer la collection…"
                value={collectionSearch}
                onChange={(e) => setCollectionSearch(e.target.value)}
                className="w-full rounded-xl border border-border bg-background pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground/50"
              />
            </div>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((r) => (
                <button
                  key={r}
                  onClick={() => setCollectionRatingFilter(collectionRatingFilter === r ? null : r)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors flex items-center gap-0.5 cursor-pointer ${
                    collectionRatingFilter === r
                      ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                      : "bg-white/5 text-muted-foreground hover:text-white"
                  }`}
                >
                  {r}
                  <Star className="w-3 h-3 fill-current" aria-hidden="true" />
                  +
                </button>
              ))}
            </div>
          </div>

          {filteredCollection.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">
              {watchedMovies.length === 0
                ? "Aucun film vu pour le moment. Explorez le catalogue et marquez des films comme vus !"
                : "Aucun film ne correspond aux filtres."}
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCollection.map((movie) => (
                <div
                  key={movie.tmdbId}
                  className="flex items-start gap-4 rounded-xl border border-border/50 bg-card p-4 hover:bg-muted/30 transition-colors"
                >
                  {movie.posterPath ? (
                    <img
                      src={`https://image.tmdb.org/t/p/w154${movie.posterPath}`}
                      alt=""
                      className="w-16 h-24 rounded-lg object-cover flex-shrink-0"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-16 h-24 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                      <Eye className="w-5 h-5 text-muted-foreground/50" aria-hidden="true" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0 space-y-1">
                    <h3 className="font-semibold text-sm truncate">{movie.title}</h3>
                    <p className="text-xs text-muted-foreground">
                      {movie.director && <span>{movie.director}</span>}
                      {movie.releaseYear && <span> · {movie.releaseYear}</span>}
                    </p>
                    {movie.rating != null && (
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((n) => {
                          const filled = movie.rating! >= n;
                          const half = !filled && movie.rating! >= n - 0.5;
                          return half ? (
                            <div key={n} className="relative w-3.5 h-3.5">
                              <Star className="w-3.5 h-3.5 text-muted-foreground/30 absolute inset-0" />
                              <StarHalf className="w-3.5 h-3.5 fill-amber-400 text-amber-400 absolute inset-0" />
                            </div>
                          ) : (
                            <Star key={n} className={`w-3.5 h-3.5 ${filled ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} />
                          );
                        })}
                        <span className="text-xs text-amber-400 font-medium ml-1">{movie.rating}</span>
                      </div>
                    )}
                    {movie.watchedAt && (
                      <p className="text-xs text-muted-foreground/70">
                        Vu le {new Date(movie.watchedAt).toLocaleDateString("fr-FR")}
                      </p>
                    )}
                    <button
                      onClick={() => handleRemoveWatched(movie.tmdbId)}
                      className="text-xs text-red-400/70 hover:text-red-400 transition-colors mt-1 cursor-pointer"
                    >
                      Retirer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Mark watched dialog */}
      <MarkWatchedDialog
        movie={dialogMovie}
        onClose={() => setDialogMovie(null)}
        onConfirm={handleMarkWatched}
      />
    </div>
  );
}

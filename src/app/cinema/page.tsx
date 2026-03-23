import { discoverMovies, getMovieWithCredits, getDirector, getTopCast, formatRuntime, getGenreList } from "@/lib/tmdb";
import { prisma } from "@/lib/prisma";
import { CinemaClient } from "@/components/cinema/CinemaClient";
import type { MovieCardData } from "@/components/cinema/MovieCard";

export const dynamic = "force-dynamic";

/**
 * Page Cinéma — Explorer le catalogue TMDB avec filtres + gérer les films vus.
 */
export default async function CinemaPage() {
  const currentYear = new Date().getFullYear();

  // Parallel fetch: genres, discover (current year, popular), watched movies
  const [genreList, discoverResult, watchedMovies] = await Promise.all([
    getGenreList(),
    discoverMovies({ page: 1, year: currentYear }),
    prisma.movie.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        tmdbId: true,
        title: true,
        posterPath: true,
        director: true,
        releaseYear: true,
        rating: true,
        watchedAt: true,
        overview: true,
      },
    }),
  ]);

  const watchedTmdbIds = watchedMovies
    .filter((m) => m.tmdbId != null)
    .map((m) => m.tmdbId as number);
  const watchedSet = new Set(watchedTmdbIds);

  // Enrich discover results with credits
  const detailed = await Promise.all(
    discoverResult.results.map(async (m) => {
      try {
        return await getMovieWithCredits(m.id);
      } catch {
        return null;
      }
    })
  );

  const today = new Date().toISOString().slice(0, 10);
  const initialMovies: MovieCardData[] = detailed
    .filter((m) => m !== null)
    .filter((movie) => movie.release_date && movie.release_date <= today)
    .map((movie) => {
      const director = getDirector(movie);
      return {
        tmdbId: movie.id,
        title: movie.title,
        originalTitle: movie.original_title !== movie.title ? movie.original_title : null,
        posterPath: movie.poster_path,
        rating: movie.vote_average,
        runtimeMinutes: movie.runtime,
        runtime: movie.runtime ? formatRuntime(movie.runtime) : null,
        director: director?.name ?? null,
        cast: getTopCast(movie, 3).map((c) => c.name),
        releaseDate: movie.release_date,
        genres: movie.genres.slice(0, 2).map((g) => g.name),
        overview: movie.overview,
        watched: watchedSet.has(movie.id),
      };
    });

  const serializedWatched = watchedMovies
    .filter((m) => m.tmdbId != null)
    .map((m) => ({
      tmdbId: m.tmdbId as number,
      title: m.title,
      posterPath: m.posterPath,
      director: m.director,
      releaseYear: m.releaseYear,
      rating: m.rating,
      watchedAt: m.watchedAt?.toISOString() ?? null,
      overview: m.overview ?? null,
    }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight">Cinéma</h1>
        <p className="text-muted-foreground mt-2 text-lg">Explorez le catalogue et gérez vos films vus</p>
      </div>
      <CinemaClient
        initialMovies={initialMovies}
        initialTotalPages={discoverResult.total_pages}
        genres={genreList}
        watchedTmdbIds={watchedTmdbIds}
        watchedMovies={serializedWatched}
      />
    </div>
  );
}

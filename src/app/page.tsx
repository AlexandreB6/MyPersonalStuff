import { getNowPlaying, getMovieWithCredits, getDirector, getTopCast, formatRuntime } from "@/lib/tmdb";
import { MovieGrid } from "@/components/MovieGrid";
import type { MovieCardData } from "@/components/MovieCard";

/**
 * Page d'accueil — affiche les films actuellement à l'affiche.
 * Charge les 2 premières pages (40 films) côté serveur, le reste est paginé côté client.
 */
export default async function HomePage() {
  // Load first 2 pages (40 movies) on initial render
  const [page1, page2] = await Promise.all([
    getNowPlaying(1),
    getNowPlaying(2),
  ]);

  const allNowPlaying = [...page1.results, ...page2.results];

  const moviesDetails = await Promise.all(
    allNowPlaying.map((m) => getMovieWithCredits(m.id))
  );

  const movies: MovieCardData[] = moviesDetails.map((movie) => {
    const director = getDirector(movie);
    return {
      id: movie.id,
      title: movie.title,
      posterPath: movie.poster_path,
      rating: movie.vote_average,
      runtime: movie.runtime ? formatRuntime(movie.runtime) : null,
      director: director?.name ?? null,
      cast: getTopCast(movie, 3).map((c) => c.name),
      releaseDate: movie.release_date,
      genres: movie.genres.slice(0, 2).map((g) => g.name),
    };
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight">À l&apos;affiche</h1>
        <p className="text-muted-foreground mt-2 text-lg">Les dernières sorties au cinéma</p>
      </div>
      <MovieGrid initialMovies={movies} initialPage={2} totalPages={page1.total_pages} />
    </div>
  );
}

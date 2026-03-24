/**
 * Route API : GET /api/now-playing
 * Retourne les films actuellement à l'affiche avec leurs détails (crédits, genres, durée).
 * Utilisé par MovieGrid pour le chargement paginé côté client.
 */

import { NextRequest, NextResponse } from "next/server";
import { getNowPlaying, getMovieWithCredits, getDirector, getTopCast, formatRuntime } from "@/lib/tmdb";

/** Récupère une page de films à l'affiche avec détails enrichis. */
export async function GET(req: NextRequest) {
  const page = Number(req.nextUrl.searchParams.get("page") ?? "1");

  const { results: nowPlaying, total_pages } = await getNowPlaying(page);

  const movies = await Promise.all(
    nowPlaying.map((m) => getMovieWithCredits(m.id))
  );

  const serialized = movies.map((movie) => {
    const director = getDirector(movie);
    return {
      tmdbId: movie.id,
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

  return NextResponse.json({ movies: serialized, totalPages: total_pages, page });
}

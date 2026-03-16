/**
 * Helpers TMDB — fonctions serveur pour interroger l'API The Movie Database.
 * Toutes les requêtes passent par ce module pour garder la clé API côté serveur.
 */

const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_API_KEY = process.env.TMDB_API_KEY || "";

/** Film tel que renvoyé par l'endpoint now_playing */
export interface NowPlayingMovie {
  id: number;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  release_date: string;
  vote_average: number;
}

/** Membre du casting d'un film */
export interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order: number;
}

/** Membre de l'équipe technique d'un film */
export interface CrewMember {
  id: number;
  name: string;
  job: string;
  department: string;
  profile_path: string | null;
}

/** Vidéo associée à un film (bande-annonce, teaser, etc.) */
export interface MovieVideo {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
  official: boolean;
}

/** Détails complets d'un film avec crédits et vidéos */
export interface MovieDetails {
  id: number;
  title: string;
  original_title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  release_date: string;
  vote_average: number;
  vote_count: number;
  runtime: number;
  genres: { id: number; name: string }[];
  production_countries: { iso_3166_1: string; name: string }[];
  budget: number;
  revenue: number;
  tagline: string;
  imdb_id: string | null;
  homepage: string | null;
  credits: {
    cast: CastMember[];
    crew: CrewMember[];
  };
  videos: {
    results: MovieVideo[];
  };
}

/** Critique utilisateur TMDB */
export interface TmdbReview {
  id: string;
  author: string;
  author_details: {
    name: string;
    username: string;
    avatar_path: string | null;
    rating: number | null;
  };
  content: string;
  created_at: string;
  url: string;
}

/** Récupère les films actuellement à l'affiche (région FR, langue FR). */
export async function getNowPlaying(page = 1): Promise<{ results: NowPlayingMovie[]; total_pages: number }> {
  const url = `${TMDB_BASE_URL}/movie/now_playing?api_key=${TMDB_API_KEY}&language=fr-FR&region=FR&page=${page}`;
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`TMDB now_playing failed: ${res.status}`);
  const data = await res.json();
  return { results: data.results, total_pages: data.total_pages };
}

/** Récupère les détails d'un film avec ses crédits et vidéos (append_to_response). */
export async function getMovieWithCredits(tmdbId: number): Promise<MovieDetails> {
  const url = `${TMDB_BASE_URL}/movie/${tmdbId}?api_key=${TMDB_API_KEY}&language=fr-FR&append_to_response=credits,videos`;
  const res = await fetch(url, { next: { revalidate: 86400 } });
  if (!res.ok) throw new Error(`TMDB movie details failed: ${res.status}`);
  return res.json();
}

/** Récupère les critiques d'un film — fusionne FR et EN, dédupliquées, triées par note. */
export async function getMovieReviews(tmdbId: number, page = 1): Promise<{ results: TmdbReview[]; total_results: number }> {
  const [frRes, enRes] = await Promise.all([
    fetch(`${TMDB_BASE_URL}/movie/${tmdbId}/reviews?api_key=${TMDB_API_KEY}&language=fr-FR&page=${page}`, { next: { revalidate: 86400 } }),
    fetch(`${TMDB_BASE_URL}/movie/${tmdbId}/reviews?api_key=${TMDB_API_KEY}&language=en-US&page=${page}`, { next: { revalidate: 86400 } }),
  ]);

  const frData = frRes.ok ? await frRes.json() : { results: [], total_results: 0 };
  const enData = enRes.ok ? await enRes.json() : { results: [], total_results: 0 };

  // Déduplique par id, les critiques FR ont la priorité
  const seen = new Set<string>();
  const merged: TmdbReview[] = [];
  for (const r of [...frData.results, ...enData.results]) {
    if (!seen.has(r.id)) {
      seen.add(r.id);
      merged.push(r);
    }
  }

  return {
    results: merged.sort((a: TmdbReview, b: TmdbReview) => (b.author_details.rating ?? 0) - (a.author_details.rating ?? 0)),
    total_results: frData.total_results + enData.total_results,
  };
}

/** Extrait le réalisateur (job === "Director") depuis les crédits d'un film. */
export function getDirector(movie: MovieDetails): CrewMember | null {
  return movie.credits.crew.find((c) => c.job === "Director") ?? null;
}

/** Retourne les N acteurs principaux triés par ordre d'apparition. */
export function getTopCast(movie: MovieDetails, count = 4): CastMember[] {
  return movie.credits.cast
    .sort((a, b) => a.order - b.order)
    .slice(0, count);
}

/** Formate une durée en minutes vers "XhMM" ou "Xmin". */
export function formatRuntime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h${m.toString().padStart(2, "0")}` : `${m}min`;
}

/** Trouve la meilleure bande-annonce YouTube (officielle > trailer > toute vidéo). */
export function getTrailer(movie: MovieDetails): MovieVideo | null {
  const vids = movie.videos?.results ?? [];
  return (
    vids.find((v) => v.site === "YouTube" && v.type === "Trailer" && v.official) ??
    vids.find((v) => v.site === "YouTube" && v.type === "Trailer") ??
    vids.find((v) => v.site === "YouTube") ??
    null
  );
}

/** Génère un slug URL-safe à partir du titre et de l'id TMDB (ex: "mon-film-12345"). */
export function slugify(title: string, id: number): string {
  const slug = title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return `${slug}-${id}`;
}

/** Extrait l'id TMDB numérique depuis un slug (ex: "mon-film-12345" → 12345). */
export function extractIdFromSlug(slug: string): number {
  const match = slug.match(/-(\d+)$/);
  if (!match) throw new Error("Invalid movie slug");
  return Number(match[1]);
}

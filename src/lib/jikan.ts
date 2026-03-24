/**
 * Helpers Jikan — fonctions pour interroger l'API Jikan (MyAnimeList).
 * https://api.jikan.moe/v4
 */

const JIKAN_BASE_URL = "https://api.jikan.moe/v4";

/** Manga tel que renvoyé par l'API Jikan */
export interface JikanManga {
  mal_id: number;
  title: string;
  title_japanese: string | null;
  images: {
    jpg: {
      image_url: string | null;
      large_image_url: string | null;
    };
  };
  authors: { name: string }[];
  volumes: number | null;
  chapters: number | null;
  synopsis: string | null;
  genres: { name: string }[];
  demographics: { name: string }[];
  score: number | null;
  status: string | null;
}

/** Réponse paginée de l'API Jikan */
interface JikanSearchResponse {
  data: JikanManga[];
  pagination: {
    last_visible_page: number;
    has_next_page: boolean;
  };
}

/** Recherche des mangas via Jikan. */
export async function searchManga(query: string): Promise<JikanManga[]> {
  const url = `${JIKAN_BASE_URL}/manga?q=${encodeURIComponent(query)}&limit=10&sfw=true&type=manga`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Jikan search failed: ${res.status}`);
  const data: JikanSearchResponse = await res.json();
  return data.data;
}

/** Récupère les détails d'un manga par son ID MAL. */
export async function getMangaById(malId: number): Promise<JikanManga> {
  const url = `${JIKAN_BASE_URL}/manga/${malId}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Jikan manga detail failed: ${res.status}`);
  const data = await res.json();
  return data.data;
}

/** Extrait le nom de l'auteur principal depuis la réponse Jikan. */
export function getAuthor(manga: JikanManga): string | null {
  return manga.authors?.[0]?.name ?? null;
}

/** Formate les genres en chaîne séparée par des virgules. */
export function formatGenres(manga: JikanManga): string {
  return manga.genres.map((g) => g.name).join(", ");
}

// Re-export des fonctions de slug depuis utils.ts pour rétrocompatibilité
import { makeSlug, extractIdFromSlug } from "./utils";

/** Génère un slug URL-safe depuis le titre et l'ID MAL. */
export const mangaSlugify = makeSlug;

/** Extrait l'ID MAL depuis un slug manga. */
export const extractMalIdFromSlug = extractIdFromSlug;

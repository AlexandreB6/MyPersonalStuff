/**
 * Helpers AniList — API GraphQL de fallback quand Jikan est indisponible.
 * https://graphql.anilist.co
 *
 * Les résultats sont convertis au format JikanManga pour compatibilité
 * avec le reste de l'application.
 */

import type { JikanManga } from "./jikan";

const ANILIST_URL = "https://graphql.anilist.co";

const SEARCH_QUERY = `
query ($search: String!, $perPage: Int) {
  Page(page: 1, perPage: $perPage) {
    media(search: $search, type: MANGA, isAdult: false) {
      id
      title { romaji native english }
      coverImage { large medium }
      staff(sort: RELEVANCE, perPage: 3) {
        edges {
          role
          node { name { full } }
        }
      }
      volumes
      chapters
      description(asHtml: false)
      genres
      tags { name category isMediaSpoiler }
      averageScore
      status
    }
  }
}
`;

interface AniListMedia {
  id: number;
  title: { romaji: string | null; native: string | null; english: string | null };
  coverImage: { large: string | null; medium: string | null } | null;
  staff: {
    edges: { role: string; node: { name: { full: string | null } } }[];
  };
  volumes: number | null;
  chapters: number | null;
  description: string | null;
  genres: string[];
  tags: { name: string; category: string; isMediaSpoiler: boolean }[];
  averageScore: number | null;
  status: string | null;
}

/** Mappe un statut AniList vers le format Jikan. */
function mapStatus(status: string | null): string | null {
  switch (status) {
    case "FINISHED": return "Finished";
    case "RELEASING": return "Publishing";
    case "HIATUS": return "On Hiatus";
    case "NOT_YET_RELEASED": return "Not yet published";
    case "CANCELLED": return "Discontinued";
    default: return status;
  }
}

/** Détecte la démographie depuis les tags AniList. */
function extractDemographic(tags: AniListMedia["tags"]): string | null {
  const demoTag = tags.find(
    (t) => !t.isMediaSpoiler && ["Shounen", "Seinen", "Shoujo", "Josei"].includes(t.name),
  );
  return demoTag?.name ?? null;
}

/** Extrait l'auteur (rôle "Story") depuis le staff AniList. */
function extractAuthor(staff: AniListMedia["staff"]): string | null {
  const storyAuthor = staff.edges.find((e) => e.role === "Story");
  const author = storyAuthor ?? staff.edges[0];
  return author?.node?.name?.full ?? null;
}

/** Convertit un résultat AniList en JikanManga. */
function toJikanManga(media: AniListMedia): JikanManga {
  const demographic = extractDemographic(media.tags);
  return {
    mal_id: media.id, // ID AniList utilisé comme identifiant
    title: media.title.romaji ?? media.title.english ?? "Sans titre",
    title_japanese: media.title.native,
    images: {
      jpg: {
        image_url: media.coverImage?.medium ?? null,
        large_image_url: media.coverImage?.large ?? null,
      },
    },
    authors: extractAuthor(media.staff)
      ? [{ name: extractAuthor(media.staff)! }]
      : [],
    volumes: media.volumes,
    chapters: media.chapters,
    synopsis: media.description,
    genres: media.genres.map((name) => ({ name })),
    demographics: demographic ? [{ name: demographic }] : [],
    score: media.averageScore != null ? media.averageScore / 10 : null,
    status: mapStatus(media.status),
  };
}

/** Recherche des mangas via AniList (fallback). */
export async function searchMangaAniList(query: string): Promise<JikanManga[]> {
  const res = await fetch(ANILIST_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: SEARCH_QUERY,
      variables: { search: query, perPage: 10 },
    }),
  });

  if (!res.ok) throw new Error(`AniList search failed: ${res.status}`);

  const json = await res.json();
  const media: AniListMedia[] = json.data?.Page?.media ?? [];
  return media.map(toJikanManga);
}

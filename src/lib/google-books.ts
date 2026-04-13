/**
 * Helpers Google Books API — source primaire pour les éditions manga françaises.
 * https://www.googleapis.com/books/v1/volumes
 *
 * Stratégie : on recherche des volumes en filtrant sur la langue FR et le sujet
 * "Comics & Graphic Novels", puis on regroupe en séries (titre normalisé + éditeur + édition)
 * pour afficher une fiche par série avec la liste de ses éditions FR.
 */

const GB_BASE = "https://www.googleapis.com/books/v1/volumes";

/** Volume brut Google Books (réponse API, champs utiles uniquement). */
interface GBVolumeInfo {
  title: string;
  subtitle?: string;
  authors?: string[];
  publisher?: string;
  publishedDate?: string;
  description?: string;
  industryIdentifiers?: { type: string; identifier: string }[];
  pageCount?: number;
  categories?: string[];
  language?: string;
  imageLinks?: { thumbnail?: string; smallThumbnail?: string };
}

interface GBVolume {
  id: string;
  volumeInfo: GBVolumeInfo;
}

interface GBSearchResponse {
  totalItems: number;
  items?: GBVolume[];
}

/** Une série manga agrégée à partir de plusieurs volumes Google Books. */
export interface MangaSeries {
  /** Identifiant stable = id Google Books du premier volume de la série (tome 1 si trouvé). */
  googleBooksId: string;
  /** Titre nettoyé (sans n° de tome). */
  title: string;
  /** Auteur principal. */
  author: string | null;
  /** Éditeur FR. */
  publisher: string | null;
  /** Label d'édition détecté ("Intégrale", "Deluxe", "Perfect Edition"…) ou null. */
  editionLabel: string | null;
  /** URL couverture (celle du tome 1 si dispo). */
  coverImage: string | null;
  /** Nombre de volumes détectés dans cette édition. */
  volumeCount: number;
  /** Numéros de volumes détectés. */
  volumeNumbers: number[];
  /** Synopsis court (celui du tome 1). */
  synopsis: string | null;
  /** ISBN du tome 1 si disponible. */
  firstVolumeIsbn: string | null;
}

/** Volume individuel au sein d'une série (pour la page détail). */
export interface MangaVolume {
  googleBooksId: string;
  volumeNumber: number | null;
  title: string;
  coverImage: string | null;
  isbn: string | null;
  publishedDate: string | null;
}

const EDITION_KEYWORDS = [
  "Perfect Edition",
  "Perfect",
  "Deluxe",
  "Intégrale",
  "Integrale",
  "Ultimate",
  "Collector",
  "Anniversaire",
  "Édition Spéciale",
  "Edition Speciale",
  "Nouvelle Édition",
  "Master Edition",
];

/** Extrait le numéro de tome d'un titre (ex: "Berserk, Tome 3" → 3). */
function extractVolumeNumber(title: string): number | null {
  const patterns = [
    /(?:Tome|T\.?|Vol\.?|Volume|Livre|N°|#)\s*(\d+)/i,
    /,\s*(\d+)\s*$/,
    /\s(\d+)\s*$/,
  ];
  for (const re of patterns) {
    const match = title.match(re);
    if (match) {
      const n = parseInt(match[1], 10);
      if (n > 0 && n < 500) return n;
    }
  }
  return null;
}

/** Détecte un label d'édition dans un titre. */
function extractEditionLabel(title: string): string | null {
  const lower = title.toLowerCase();
  for (const kw of EDITION_KEYWORDS) {
    if (lower.includes(kw.toLowerCase())) {
      return kw;
    }
  }
  return null;
}

/** Nettoie un titre de volume pour obtenir le titre de série. */
function cleanSeriesTitle(title: string): string {
  return title
    .replace(/,?\s*(Tome|T\.?|Vol\.?|Volume|Livre|N°|#)\s*\d+.*$/i, "")
    .replace(/\s*[-–—]\s*\d+\s*$/, "")
    .replace(/,\s*\d+\s*$/, "")
    .replace(/\s*\(.*?\)\s*/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/** Normalise un titre pour le regroupement (casse + accents). */
function normalizeForKey(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "")
    .trim();
}

/** Extrait l'ISBN-13 prioritairement, sinon ISBN-10, d'un volume Google Books. */
function extractIsbn(info: GBVolumeInfo): string | null {
  if (!info.industryIdentifiers) return null;
  const isbn13 = info.industryIdentifiers.find((i) => i.type === "ISBN_13");
  if (isbn13) return isbn13.identifier;
  const isbn10 = info.industryIdentifiers.find((i) => i.type === "ISBN_10");
  return isbn10?.identifier ?? null;
}

/** Force HTTPS sur les URLs images Google Books (souvent retournées en HTTP). */
function httpsify(url: string | undefined): string | null {
  if (!url) return null;
  return url.replace(/^http:\/\//, "https://");
}

/** Appel brut à l'API Google Books. Utilise GOOGLE_BOOKS_API_KEY si défini (recommandé pour éviter les 429 sur le quota partagé). */
async function fetchGB(query: string, maxResults = 40): Promise<GBVolume[]> {
  const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
  const keyParam = apiKey ? `&key=${apiKey}` : "";
  const url = `${GB_BASE}?q=${encodeURIComponent(query)}&langRestrict=fr&country=FR&maxResults=${maxResults}&printType=books${keyParam}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Google Books ${res.status}: ${body.slice(0, 300)}`);
  }
  const data: GBSearchResponse = await res.json();
  if (!data.items || data.items.length === 0) {
    throw new Error(`Google Books empty response: totalItems=${data.totalItems}`);
  }
  return data.items;
}

/**
 * Recherche des séries manga via Google Books.
 * Regroupe les volumes par (titre normalisé + éditeur + édition) et retourne une fiche par série.
 */
export async function searchMangaSeries(query: string): Promise<MangaSeries[]> {
  const items = await fetchGB(`${query} manga`, 40);
  const rawCount = items.length;
  const languages = Array.from(new Set(items.map((i) => i.volumeInfo.language ?? "?")));
  let filteredByLang = 0;

  // Groupe les volumes par clé série (titre normalisé + éditeur + édition)
  const groups = new Map<string, GBVolume[]>();
  for (const item of items) {
    const info = item.volumeInfo;
    if (info.language && info.language !== "fr") {
      filteredByLang++;
      continue;
    }
    const seriesTitle = cleanSeriesTitle(info.title);
    if (!seriesTitle) continue;
    const edition = extractEditionLabel(info.title);
    const key = `${normalizeForKey(seriesTitle)}::${normalizeForKey(info.publisher ?? "")}::${edition ?? ""}`;
    const list = groups.get(key);
    if (list) list.push(item);
    else groups.set(key, [item]);
  }

  const series: MangaSeries[] = [];
  for (const [, volumes] of groups) {
    // Trie par n° de tome (tome 1 en premier pour la couverture/synopsis)
    const withNumbers = volumes
      .map((v) => ({ v, num: extractVolumeNumber(v.volumeInfo.title) }))
      .sort((a, b) => {
        if (a.num == null && b.num == null) return 0;
        if (a.num == null) return 1;
        if (b.num == null) return -1;
        return a.num - b.num;
      });

    const first = withNumbers[0].v;
    const info = first.volumeInfo;
    const seriesTitle = cleanSeriesTitle(info.title);
    const volumeNumbers = withNumbers
      .map((w) => w.num)
      .filter((n): n is number => n != null);

    series.push({
      googleBooksId: first.id,
      title: seriesTitle,
      author: info.authors?.[0] ?? null,
      publisher: info.publisher ?? null,
      editionLabel: extractEditionLabel(info.title),
      coverImage: httpsify(info.imageLinks?.thumbnail ?? info.imageLinks?.smallThumbnail),
      volumeCount: volumeNumbers.length > 0 ? Math.max(...volumeNumbers) : volumes.length,
      volumeNumbers: Array.from(new Set(volumeNumbers)).sort((a, b) => a - b),
      synopsis: info.description ?? null,
      firstVolumeIsbn: extractIsbn(info),
    });
  }

  if (series.length === 0) {
    throw new Error(
      `Google Books: 0 series after grouping (raw=${rawCount}, filteredByLang=${filteredByLang}, languages=${languages.join(",")})`,
    );
  }

  // Trie par nombre de volumes décroissant (les séries les plus complètes en premier)
  return series.sort((a, b) => b.volumeCount - a.volumeCount);
}

/** Récupère un volume Google Books par son ID. */
export async function getVolumeById(id: string): Promise<MangaSeries | null> {
  const res = await fetch(`${GB_BASE}/${id}`, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) return null;
  const item: GBVolume = await res.json();
  const info = item.volumeInfo;
  const seriesTitle = cleanSeriesTitle(info.title);

  return {
    googleBooksId: item.id,
    title: seriesTitle,
    author: info.authors?.[0] ?? null,
    publisher: info.publisher ?? null,
    editionLabel: extractEditionLabel(info.title),
    coverImage: httpsify(info.imageLinks?.thumbnail ?? info.imageLinks?.smallThumbnail),
    volumeCount: 1,
    volumeNumbers: [],
    synopsis: info.description ?? null,
    firstVolumeIsbn: extractIsbn(info),
  };
}

/** Recherche par ISBN exact. */
export async function searchByIsbn(isbn: string): Promise<MangaSeries | null> {
  const items = await fetchGB(`isbn:${isbn}`, 1);
  if (items.length === 0) return null;
  const first = items[0];
  const info = first.volumeInfo;
  const seriesTitle = cleanSeriesTitle(info.title);

  return {
    googleBooksId: first.id,
    title: seriesTitle,
    author: info.authors?.[0] ?? null,
    publisher: info.publisher ?? null,
    editionLabel: extractEditionLabel(info.title),
    coverImage: httpsify(info.imageLinks?.thumbnail ?? info.imageLinks?.smallThumbnail),
    volumeCount: 1,
    volumeNumbers: [],
    synopsis: info.description ?? null,
    firstVolumeIsbn: extractIsbn(info),
  };
}

/** Récupère la liste des volumes d'une série (titre + éditeur + édition). */
export async function getSeriesVolumes(
  title: string,
  publisher: string | null,
  editionLabel: string | null,
): Promise<MangaVolume[]> {
  const parts = [title];
  if (publisher) parts.push(`inpublisher:"${publisher}"`);
  const items = await fetchGB(parts.join(" "), 40);

  const volumes: MangaVolume[] = [];
  const normalizedTitle = normalizeForKey(title);
  const normalizedPublisher = publisher ? normalizeForKey(publisher) : null;

  for (const item of items) {
    const info = item.volumeInfo;
    if (info.language && info.language !== "fr") continue;
    const seriesTitle = cleanSeriesTitle(info.title);
    if (normalizeForKey(seriesTitle) !== normalizedTitle) continue;
    if (normalizedPublisher && normalizeForKey(info.publisher ?? "") !== normalizedPublisher) continue;
    const thisEdition = extractEditionLabel(info.title);
    if ((thisEdition ?? null) !== (editionLabel ?? null)) continue;

    volumes.push({
      googleBooksId: item.id,
      volumeNumber: extractVolumeNumber(info.title),
      title: info.title,
      coverImage: httpsify(info.imageLinks?.thumbnail ?? info.imageLinks?.smallThumbnail),
      isbn: extractIsbn(info),
      publishedDate: info.publishedDate ?? null,
    });
  }

  return volumes.sort((a, b) => {
    if (a.volumeNumber == null && b.volumeNumber == null) return 0;
    if (a.volumeNumber == null) return 1;
    if (b.volumeNumber == null) return -1;
    return a.volumeNumber - b.volumeNumber;
  });
}

/**
 * Helpers BnF SRU — fallback quand Google Books est indisponible.
 * https://api.bnf.fr/fr/api-sru-catalogue-general
 *
 * Le catalogue général de la BnF couvre le dépôt légal français : exhaustif
 * pour les éditions FR, y compris les intégrales exclusives (Planète BD, etc.).
 * Retourne du Dublin Core XML que l'on parse en structure compatible avec
 * google-books.ts (MangaSeries / MangaVolume).
 */

import type { MangaSeries, MangaVolume } from "./google-books";

const BNF_SRU_BASE = "http://catalogue.bnf.fr/api/SRU";

/** Encode une requête SRU CQL pour la BnF. */
function buildSruUrl(cql: string, maxRecords = 20): string {
  const params = new URLSearchParams({
    version: "1.2",
    operation: "searchRetrieve",
    query: cql,
    recordSchema: "dublincore",
    maximumRecords: String(maxRecords),
  });
  return `${BNF_SRU_BASE}?${params.toString()}`;
}

/** Extrait toutes les valeurs d'un tag Dublin Core d'un record XML. */
function extractDcValues(xml: string, tag: string): string[] {
  const regex = new RegExp(`<dc:${tag}[^>]*>([\\s\\S]*?)</dc:${tag}>`, "gi");
  const values: string[] = [];
  let match;
  while ((match = regex.exec(xml)) !== null) {
    values.push(match[1].replace(/<[^>]+>/g, "").trim());
  }
  return values;
}

/** Découpe la réponse SRU en records individuels. */
function splitRecords(xml: string): string[] {
  const regex = /<srw:record>([\s\S]*?)<\/srw:record>/g;
  const records: string[] = [];
  let match;
  while ((match = regex.exec(xml)) !== null) {
    records.push(match[1]);
  }
  return records;
}

/** Strippe le suffixe "/ Créateur" des titres BnF. */
function stripCreator(title: string): string {
  return title.replace(/\s*\/\s*.+$/, "").trim();
}

/** Extrait le numéro de tome depuis un titre Dublin Core. */
function extractVolumeNumber(title: string): number | null {
  const cleaned = stripCreator(title);
  const patterns = [
    /(?:Tome|T\.?|Vol\.?|Volume)\s*(\d+)/i,
    /\.\s*(\d+)(?:\s|$)/,
    /,\s*(\d+)(?:\s|$)/,
  ];
  for (const re of patterns) {
    const match = cleaned.match(re);
    if (match) {
      const n = parseInt(match[1], 10);
      if (n > 0 && n < 500) return n;
    }
  }
  return null;
}

/** Nettoie le titre pour obtenir le titre de série. */
function cleanSeriesTitle(title: string): string {
  return stripCreator(title)
    .replace(/,?\s*(Tome|T\.?|Vol\.?|Volume)\s*\d+.*$/i, "")
    .replace(/\.\s*\d+.*$/, "")
    .replace(/,\s*\d+.*$/, "")
    .replace(/\s*\([^)]*\)\s*/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/** Parse un record Dublin Core en MangaVolume. Filtre les types non-livre. */
function parseRecord(xml: string): {
  title: string;
  creator: string | null;
  publisher: string | null;
  isbn: string | null;
  date: string | null;
  description: string | null;
} | null {
  const titles = extractDcValues(xml, "title");
  if (titles.length === 0) return null;

  // Filtre: ne garde que les livres/textes imprimés. Exclut albums, vidéos, etc.
  const types = extractDcValues(xml, "type");
  const typeStr = types.join(" ").toLowerCase();
  const isBook =
    typeStr.includes("texte") ||
    typeStr.includes("monographie") ||
    typeStr.includes("livre") ||
    typeStr.includes("text") ||
    types.length === 0;
  if (!isBook) return null;

  const creators = extractDcValues(xml, "creator");
  const publishers = extractDcValues(xml, "publisher");
  const identifiers = extractDcValues(xml, "identifier");
  const dates = extractDcValues(xml, "date");
  const descriptions = extractDcValues(xml, "description");

  const isbn = identifiers
    .map((s) => s.match(/\b(97[89]\d{10}|\d{9}[\dX])\b/))
    .find((m) => m != null)?.[0] ?? null;

  return {
    title: titles[0],
    creator: creators[0] ?? null,
    publisher: publishers[0] ?? null,
    isbn,
    date: dates[0] ?? null,
    description: descriptions[0] ?? null,
  };
}

/** Appel SRU brut. */
async function fetchSru(cql: string, maxRecords = 20): Promise<string[]> {
  const url = buildSruUrl(cql, maxRecords);
  const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw new Error(`BnF SRU failed: ${res.status}`);
  const xml = await res.text();
  return splitRecords(xml);
}

/** Recherche de séries manga via la BnF (fallback). */
export async function searchMangaSeriesBnf(query: string): Promise<MangaSeries[]> {
  // CQL BnF: recherche tous mots dans titre. Le filtre type livre est fait côté parseRecord.
  const cql = `bib.title all "${query.replace(/"/g, "")}"`;
  const records = await fetchSru(cql, 30);

  const groups = new Map<string, Array<{ parsed: ReturnType<typeof parseRecord>; raw: string }>>();
  for (const r of records) {
    const parsed = parseRecord(r);
    if (!parsed) continue;
    const seriesTitle = cleanSeriesTitle(parsed.title);
    const key = `${seriesTitle.toLowerCase()}::${(parsed.publisher ?? "").toLowerCase()}`;
    const list = groups.get(key);
    if (list) list.push({ parsed, raw: r });
    else groups.set(key, [{ parsed, raw: r }]);
  }

  const series: MangaSeries[] = [];
  for (const [, group] of groups) {
    const first = group[0].parsed!;
    const volumeNumbers = group
      .map((g) => extractVolumeNumber(g.parsed!.title))
      .filter((n): n is number => n != null);

    series.push({
      googleBooksId: first.isbn ?? `bnf-${cleanSeriesTitle(first.title)}`,
      title: cleanSeriesTitle(first.title),
      author: first.creator,
      publisher: first.publisher,
      editionLabel: null,
      coverImage: null,
      volumeCount: volumeNumbers.length > 0 ? Math.max(...volumeNumbers) : group.length,
      volumeNumbers: Array.from(new Set(volumeNumbers)).sort((a, b) => a - b),
      synopsis: first.description,
      firstVolumeIsbn: first.isbn,
    });
  }

  return series.sort((a, b) => b.volumeCount - a.volumeCount);
}

/** Recherche par ISBN via BnF. */
export async function searchByIsbnBnf(isbn: string): Promise<MangaSeries | null> {
  const cql = `bib.isbn any "${isbn}"`;
  const records = await fetchSru(cql, 1);
  if (records.length === 0) return null;
  const parsed = parseRecord(records[0]);
  if (!parsed) return null;

  return {
    googleBooksId: parsed.isbn ?? `bnf-${cleanSeriesTitle(parsed.title)}`,
    title: cleanSeriesTitle(parsed.title),
    author: parsed.creator,
    publisher: parsed.publisher,
    editionLabel: null,
    coverImage: null,
    volumeCount: 1,
    volumeNumbers: [],
    synopsis: parsed.description,
    firstVolumeIsbn: parsed.isbn,
  };
}

/** Récupère les volumes d'une série via BnF. */
export async function getSeriesVolumesBnf(title: string): Promise<MangaVolume[]> {
  const cql = `bib.title all "${title.replace(/"/g, "")}"`;
  const records = await fetchSru(cql, 30);

  const volumes: MangaVolume[] = [];
  const normalizedQuery = title.toLowerCase();

  for (const r of records) {
    const parsed = parseRecord(r);
    if (!parsed) continue;
    const seriesTitle = cleanSeriesTitle(parsed.title);
    if (!seriesTitle.toLowerCase().includes(normalizedQuery)) continue;

    volumes.push({
      googleBooksId: parsed.isbn ?? `bnf-${parsed.title}`,
      volumeNumber: extractVolumeNumber(parsed.title),
      title: parsed.title,
      coverImage: null,
      isbn: parsed.isbn,
      publishedDate: parsed.date,
    });
  }

  return volumes.sort((a, b) => {
    if (a.volumeNumber == null && b.volumeNumber == null) return 0;
    if (a.volumeNumber == null) return 1;
    if (b.volumeNumber == null) return -1;
    return a.volumeNumber - b.volumeNumber;
  });
}

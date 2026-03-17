import { NextRequest, NextResponse } from "next/server";
import { searchManga } from "@/lib/jikan";

/** Extrait le numéro de tome depuis le titre Google Books. */
function extractVolumeNumber(raw: string): number | null {
  const match = raw.match(/(?:Vol\.?|Tome|T\.?)\s*(\d+)/i);
  return match ? parseInt(match[1], 10) : null;
}

/** Nettoie le titre Google Books pour améliorer la recherche Jikan. */
function cleanTitle(raw: string): string {
  return raw
    .replace(/,?\s*(Vol\.?|Tome|T\.?)\s*\d+/gi, "")
    .replace(/\(.*?\)/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/** GET /api/manga/isbn?isbn=9782723489119 */
export async function GET(request: NextRequest) {
  const isbn = request.nextUrl.searchParams.get("isbn");

  if (!isbn || !/^\d{10}(\d{3})?$/.test(isbn)) {
    return NextResponse.json(
      { error: "ISBN invalide (10 ou 13 chiffres attendus)" },
      { status: 400 },
    );
  }

  // 1. Google Books lookup
  const gbRes = await fetch(
    `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`,
  );
  if (!gbRes.ok) {
    return NextResponse.json(
      { error: "Erreur lors de la recherche Google Books" },
      { status: 502 },
    );
  }

  const gbData = await gbRes.json();
  if (!gbData.totalItems || !gbData.items?.length) {
    return NextResponse.json(
      { error: "Aucun manga trouvé pour cet ISBN" },
      { status: 404 },
    );
  }

  const title: string = gbData.items[0].volumeInfo.title;
  const volumeNumber = extractVolumeNumber(title);
  const cleanedTitle = cleanTitle(title);

  // 2. Jikan search
  const results = await searchManga(cleanedTitle);

  return NextResponse.json({ title, cleanedTitle, volumeNumber, results });
}

/**
 * Route API : /api/manga/search
 * Recherche de séries manga via Google Books (FR), fallback BnF SRU.
 */

import { NextRequest, NextResponse } from "next/server";
import { searchMangaSeries, type MangaSeries } from "@/lib/google-books";
import { searchMangaSeriesBnf } from "@/lib/bnf";

export type MangaSearchSource = "google-books" | "bnf";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");
  if (!q || q.trim().length < 2) {
    return NextResponse.json({ data: [], source: "google-books" });
  }

  let data: MangaSeries[] = [];
  let source: MangaSearchSource = "google-books";

  try {
    data = await searchMangaSeries(q.trim());
  } catch {
    // Google Books down → fallback BnF
  }

  if (data.length === 0) {
    try {
      data = await searchMangaSeriesBnf(q.trim());
      source = "bnf";
    } catch {
      return NextResponse.json(
        { error: "Impossible de contacter les APIs de recherche manga" },
        { status: 502 },
      );
    }
  }

  return NextResponse.json({ data, source });
}

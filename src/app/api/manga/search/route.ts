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
  let gbError: string | null = null;

  try {
    data = await searchMangaSeries(q.trim());
  } catch (err) {
    gbError = err instanceof Error ? err.message : String(err);
  }

  if (data.length === 0) {
    try {
      data = await searchMangaSeriesBnf(q.trim());
      source = "bnf";
    } catch {
      return NextResponse.json(
        { error: "Impossible de contacter les APIs de recherche manga", gbError, hasKey: Boolean(process.env.GOOGLE_BOOKS_API_KEY) },
        { status: 502 },
      );
    }
  }

  return NextResponse.json({
    data,
    source,
    debug: {
      hasKey: Boolean(process.env.GOOGLE_BOOKS_API_KEY),
      keyLength: process.env.GOOGLE_BOOKS_API_KEY?.length ?? 0,
      gbError,
    },
  });
}

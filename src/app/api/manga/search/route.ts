/**
 * Route API : /api/manga/search
 * Recherche de séries manga via Google Books (FR). Fallback BnF désactivé temporairement.
 */

import { NextRequest, NextResponse } from "next/server";
import { searchMangaSeries, type MangaSeries } from "@/lib/google-books";

export type MangaSearchSource = "google-books" | "bnf";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");
  if (!q || q.trim().length < 2) {
    return NextResponse.json({ data: [], source: "google-books" });
  }

  let data: MangaSeries[] = [];
  let gbError: string | null = null;

  try {
    data = await searchMangaSeries(q.trim());
  } catch (err) {
    gbError = err instanceof Error ? err.message : String(err);
  }

  return NextResponse.json({
    data,
    source: "google-books" as MangaSearchSource,
    debug: {
      hasKey: Boolean(process.env.GOOGLE_BOOKS_API_KEY),
      keyLength: process.env.GOOGLE_BOOKS_API_KEY?.length ?? 0,
      gbError,
      resultCount: data.length,
    },
  });
}

/**
 * Route API : GET /api/manga/isbn?isbn=...
 * Recherche par ISBN : Google Books (FR) → BnF SRU (fallback).
 */

import { NextRequest, NextResponse } from "next/server";
import { searchByIsbn } from "@/lib/google-books";
import { searchByIsbnBnf } from "@/lib/bnf";
import type { MangaSearchSource } from "../search/route";

export async function GET(request: NextRequest) {
  const isbn = request.nextUrl.searchParams.get("isbn");

  if (!isbn || !/^\d{10}(\d{3})?$/.test(isbn)) {
    return NextResponse.json(
      { error: "ISBN invalide (10 ou 13 chiffres attendus)" },
      { status: 400 },
    );
  }

  let series = null;
  let source: MangaSearchSource = "google-books";
  let gbError: string | null = null;

  try {
    series = await searchByIsbn(isbn);
  } catch (err) {
    gbError = err instanceof Error ? err.message : String(err);
  }

  if (!series) {
    try {
      series = await searchByIsbnBnf(isbn);
      if (series) source = "bnf";
    } catch {
      return NextResponse.json(
        { error: "Impossible de contacter les APIs de recherche manga" },
        { status: 502 },
      );
    }
  }

  if (!series) {
    return NextResponse.json(
      { error: "Aucun manga trouvé pour cet ISBN" },
      { status: 404 },
    );
  }

  return NextResponse.json({
    data: [series],
    source,
    debug: { gbError, coverImage: series.coverImage },
  });
}

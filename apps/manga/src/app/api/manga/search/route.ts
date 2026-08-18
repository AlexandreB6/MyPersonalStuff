/**
 * Route API : /api/manga/search
 * Proxy vers l'API Jikan pour la recherche de mangas.
 */

import { NextRequest, NextResponse } from "next/server";
import { searchManga } from "@/lib/jikan";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");
  if (!q || q.trim().length < 2) {
    return NextResponse.json([]);
  }

  try {
    const { data, source } = await searchManga(q.trim());
    return NextResponse.json({ data, source });
  } catch {
    return NextResponse.json({ error: "Jikan API error" }, { status: 502 });
  }
}

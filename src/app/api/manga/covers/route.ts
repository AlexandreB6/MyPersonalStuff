import { NextRequest, NextResponse } from "next/server";

interface OpenLibraryDoc {
  title: string;
  author_name?: string[];
  publisher?: string[];
  cover_i?: number;
}

interface OpenLibraryResponse {
  docs: OpenLibraryDoc[];
}

/** GET /api/manga/covers?q=Baki */
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q");
  if (!q || q.trim().length < 2) {
    return NextResponse.json({ error: "Paramètre q requis" }, { status: 400 });
  }

  const res = await fetch(
    `https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=20&fields=title,author_name,publisher,cover_i`,
  );
  if (!res.ok) {
    return NextResponse.json({ error: "Erreur Open Library" }, { status: 502 });
  }

  const data: OpenLibraryResponse = await res.json();

  const covers = data.docs
    .filter((doc) => doc.cover_i)
    .map((doc) => ({
      title: doc.title,
      authors: doc.author_name?.join(", ") ?? null,
      publisher: doc.publisher?.[0] ?? null,
      coverUrl: `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`,
    }));

  return NextResponse.json(covers);
}

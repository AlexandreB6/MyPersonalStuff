import { NextRequest, NextResponse } from "next/server";

interface GoogleBooksItem {
  volumeInfo: {
    title: string;
    authors?: string[];
    publisher?: string;
    imageLinks?: {
      thumbnail?: string;
      smallThumbnail?: string;
    };
  };
}

/** GET /api/manga/covers?q=Baki */
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q");
  if (!q || q.trim().length < 2) {
    return NextResponse.json({ error: "Paramètre q requis" }, { status: 400 });
  }

  const res = await fetch(
    `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q + " manga")}&maxResults=12&printType=books`,
  );
  if (!res.ok) {
    return NextResponse.json({ error: "Erreur Google Books" }, { status: 502 });
  }

  const data = await res.json();
  if (!data.items?.length) {
    return NextResponse.json([]);
  }

  const covers = (data.items as GoogleBooksItem[])
    .filter((item) => item.volumeInfo.imageLinks?.thumbnail)
    .map((item) => ({
      title: item.volumeInfo.title,
      authors: item.volumeInfo.authors?.join(", ") ?? null,
      publisher: item.volumeInfo.publisher ?? null,
      coverUrl: item.volumeInfo.imageLinks!.thumbnail!
        .replace("&edge=curl", ""),
    }));

  return NextResponse.json(covers);
}

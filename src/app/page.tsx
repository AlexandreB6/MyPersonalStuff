import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Film, Paintbrush, BookOpen, ArrowRight } from "lucide-react";
import { mangaSlugify } from "@/lib/jikan";
import { RANGE_MAP } from "@/data/paint-ranges";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [movies, mangas, paints] = await Promise.all([
    prisma.movie.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.manga.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.ownedPaint.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
  ]);

  const [movieCount, mangaCount, paintCount] = await Promise.all([
    prisma.movie.count(),
    prisma.manga.count(),
    prisma.ownedPaint.count(),
  ]);

  const totalVolumes = mangas.reduce((sum, m) => {
    const owned = JSON.parse(m.ownedVolumesMap) as number[];
    return sum + owned.length;
  }, 0);

  // For total volumes we need all mangas, not just 5
  const allMangaVolumes = await prisma.manga.findMany({ select: { ownedVolumesMap: true } });
  const totalOwnedVolumes = allMangaVolumes.reduce((sum, m) => {
    const owned = JSON.parse(m.ownedVolumesMap) as number[];
    return sum + owned.length;
  }, 0);

  const spaces = [
    {
      name: "Cinéma",
      href: "/cinema",
      icon: Film,
      color: "text-blue-400",
      bgColor: "bg-blue-500/10 border-blue-500/20",
      stats: `${movieCount} film${movieCount !== 1 ? "s" : ""}`,
    },
    {
      name: "Manga",
      href: "/manga",
      icon: BookOpen,
      color: "text-violet-400",
      bgColor: "bg-violet-500/10 border-violet-500/20",
      stats: `${mangaCount} manga${mangaCount !== 1 ? "s" : ""} · ${totalOwnedVolumes} vol.`,
    },
    {
      name: "Peinture",
      href: "/peinture",
      icon: Paintbrush,
      color: "text-amber-400",
      bgColor: "bg-amber-500/10 border-amber-500/20",
      stats: `${paintCount} peinture${paintCount !== 1 ? "s" : ""}`,
    },
  ];

  return (
    <div className="space-y-10">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-2 text-lg">Vue d&apos;ensemble de ta collection</p>
      </div>

      {/* Space cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {spaces.map((space) => (
          <Link
            key={space.href}
            href={space.href}
            className={`group flex items-center gap-4 rounded-xl border p-5 transition-all hover:shadow-lg hover:scale-[1.02] ${space.bgColor}`}
          >
            <div className={`flex h-12 w-12 items-center justify-center rounded-lg bg-background/50 ${space.color}`}>
              <space.icon className="h-6 w-6" aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">{space.name}</p>
              <p className="text-xs text-muted-foreground">{space.stats}</p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
          </Link>
        ))}
      </div>

      {/* Recent sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Derniers films */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Film className="h-4 w-4 text-blue-400" aria-hidden="true" />
              Derniers films
            </h2>
            <Link href="/cinema" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Voir tout
            </Link>
          </div>
          {movies.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Aucun film ajouté</p>
          ) : (
            <div className="space-y-2">
              {movies.map((movie) => (
                <div
                  key={movie.id}
                  className="flex items-center gap-3 rounded-lg border border-border/50 p-3 hover:bg-muted/30 transition-colors"
                >
                  {movie.posterPath ? (
                    <img
                      src={`https://image.tmdb.org/t/p/w92${movie.posterPath}`}
                      alt=""
                      className="h-14 w-10 rounded object-cover flex-shrink-0"
                      loading="lazy"
                    />
                  ) : (
                    <div className="h-14 w-10 rounded bg-muted flex items-center justify-center flex-shrink-0">
                      <Film className="h-4 w-4 text-muted-foreground/50" aria-hidden="true" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{movie.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {movie.director && <span>{movie.director}</span>}
                      {movie.releaseYear && <span> · {movie.releaseYear}</span>}
                    </p>
                    {movie.rating != null && (
                      <p className="text-xs text-amber-400 font-medium mt-0.5">
                        {"★".repeat(Math.floor(movie.rating))}{movie.rating % 1 >= 0.5 ? "⯨" : ""}{"☆".repeat(5 - Math.ceil(movie.rating))}
                        <span className="ml-1 text-amber-400/70">{movie.rating}/5</span>
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Derniers mangas */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-violet-400" aria-hidden="true" />
              Derniers mangas
            </h2>
            <Link href="/manga" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Voir tout
            </Link>
          </div>
          {mangas.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Aucun manga ajouté</p>
          ) : (
            <div className="space-y-2">
              {mangas.map((manga) => {
                const owned = JSON.parse(manga.ownedVolumesMap) as number[];
                const slug = mangaSlugify(manga.title, manga.malId);
                return (
                  <Link
                    key={manga.id}
                    href={`/manga/${slug}`}
                    className="flex items-center gap-3 rounded-lg border border-border/50 p-3 hover:bg-muted/30 transition-colors"
                  >
                    {manga.coverImage ? (
                      <img
                        src={manga.coverImage}
                        alt=""
                        className="h-14 w-10 rounded object-cover flex-shrink-0"
                        loading="lazy"
                      />
                    ) : (
                      <div className="h-14 w-10 rounded bg-muted flex items-center justify-center flex-shrink-0">
                        <BookOpen className="h-4 w-4 text-muted-foreground/50" aria-hidden="true" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{manga.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {manga.author && <span>{manga.author}</span>}
                        {manga.demographic && <span> · {manga.demographic}</span>}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {owned.length}{manga.volumes != null ? ` / ${manga.volumes}` : ""} vol.
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* Dernières peintures */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Paintbrush className="h-4 w-4 text-amber-400" aria-hidden="true" />
              Dernières peintures
            </h2>
            <Link href="/peinture" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Voir tout
            </Link>
          </div>
          {paints.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Aucune peinture ajoutée</p>
          ) : (
            <div className="space-y-2">
              {paints.map((paint) => {
                const range = RANGE_MAP.get(paint.range);
                const paintData = range?.paints.find((p) => p.id === paint.paintId);
                return (
                  <Link
                    key={paint.id}
                    href={`/peinture/${paint.range}`}
                    className="flex items-center gap-3 rounded-lg border border-border/50 p-3 hover:bg-muted/30 transition-colors"
                  >
                    <div
                      className="h-10 w-10 rounded-full flex-shrink-0 border border-white/10 shadow-inner"
                      style={{ backgroundColor: paintData?.hex ?? "#555" }}
                      aria-hidden="true"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate capitalize">{paintData?.name ?? paint.paintId.replace(/-/g, " ")}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {range?.brand ?? paint.range.replace(/-/g, " ")}
                        {paintData && <span> · {paintData.type}</span>}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

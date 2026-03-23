import { BookOpen, Plus, Check, Star, Eye } from "lucide-react";
import Link from "next/link";
import { mangaSlugify } from "@/lib/jikan";
import type { JikanManga } from "@/lib/jikan";

interface MangaSearchResultsProps {
  results: JikanManga[];
  ownedMalIds: Set<number>;
  onAdd: (manga: JikanManga) => void;
}

/**
 * Liste de résultats de recherche manga Jikan.
 * Partagé entre AddMangaDialog et ScanMangaDialog.
 */
export function MangaSearchResults({ results, ownedMalIds, onAdd }: MangaSearchResultsProps) {
  return (
    <div className="space-y-3">
      {results.map((manga) => {
        const isOwned = ownedMalIds.has(manga.mal_id);
        return (
          <div
            key={manga.mal_id}
            className={`flex gap-4 rounded-lg border p-3 transition-colors ${
              isOwned
                ? "border-emerald-500/30 bg-emerald-500/5"
                : "border-border/50 hover:border-border hover:bg-muted/30"
            }`}
          >
            {/* Couverture */}
            <div className="h-28 w-20 flex-shrink-0 overflow-hidden rounded-md bg-muted">
              {manga.images?.jpg?.image_url ? (
                <img
                  src={manga.images.jpg.image_url}
                  alt=""
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <BookOpen className="h-5 w-5 text-muted-foreground/50" aria-hidden="true" />
                </div>
              )}
            </div>

            {/* Infos */}
            <div className="flex-1 min-w-0 flex flex-col">
              <p className="text-sm font-semibold leading-tight line-clamp-1">{manga.title}</p>
              {manga.authors?.[0] && (
                <p className="text-xs text-muted-foreground mt-0.5">{manga.authors[0].name}</p>
              )}

              {/* Métadonnées */}
              <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                {manga.score != null && manga.score > 0 && (
                  <span className="inline-flex items-center gap-0.5 text-amber-400 font-medium">
                    <Star className="h-3 w-3 fill-amber-400" aria-hidden="true" />
                    {manga.score.toFixed(1)}
                  </span>
                )}
                {manga.demographics?.[0] && (
                  <span className="rounded-full bg-violet-500/15 px-1.5 py-0.5 text-[10px] font-medium text-violet-400">
                    {manga.demographics[0].name}
                  </span>
                )}
                {manga.volumes != null && <span>{manga.volumes} vol.</span>}
                {manga.status && (
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                    manga.status === "Finished"
                      ? "bg-emerald-500/15 text-emerald-400"
                      : "bg-amber-500/15 text-amber-400"
                  }`}>
                    {manga.status === "Finished" ? "Terminé" : manga.status === "Publishing" ? "En cours" : manga.status}
                  </span>
                )}
              </div>

              {/* Genres */}
              {manga.genres && manga.genres.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {manga.genres.slice(0, 4).map((g) => (
                    <span key={g.name} className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                      {g.name}
                    </span>
                  ))}
                </div>
              )}

              {/* Synopsis */}
              {manga.synopsis && (
                <p className="mt-1.5 text-xs text-muted-foreground/70 line-clamp-2 leading-relaxed">
                  {manga.synopsis}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex-shrink-0 flex flex-col items-end gap-1.5 pt-1">
              <button
                onClick={() => {
                  if (!isOwned) onAdd(manga);
                }}
                disabled={isOwned}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors cursor-pointer ${
                  isOwned
                    ? "bg-emerald-500/10 text-emerald-400 cursor-default"
                    : "bg-primary/10 text-primary hover:bg-primary/20"
                }`}
              >
                {isOwned ? (
                  <>
                    <Check className="h-3.5 w-3.5" aria-hidden="true" />
                    Ajouté
                  </>
                ) : (
                  <>
                    <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                    Ajouter
                  </>
                )}
              </button>
              <Link
                href={`/manga/${mangaSlugify(manga.title, manga.mal_id)}`}
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                Voir la fiche
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}

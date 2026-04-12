import { BookOpen, Plus, Check, Eye } from "lucide-react";
import Link from "next/link";
import type { MangaSeries } from "@/lib/google-books";

interface MangaSearchResultsProps {
  results: MangaSeries[];
  ownedGoogleBooksIds: Set<string>;
  onAdd: (series: MangaSeries) => void;
}

/**
 * Liste de résultats de recherche de séries manga (Google Books / BnF).
 * Partagé entre AddMangaDialog et ScanMangaDialog.
 */
export function MangaSearchResults({ results, ownedGoogleBooksIds, onAdd }: MangaSearchResultsProps) {
  return (
    <div className="space-y-3">
      {results.map((series) => {
        const isOwned = ownedGoogleBooksIds.has(series.googleBooksId);
        return (
          <div
            key={series.googleBooksId}
            className={`flex gap-4 rounded-lg border p-3 transition-colors ${
              isOwned
                ? "border-emerald-500/30 bg-emerald-500/5"
                : "border-border/50 hover:border-border hover:bg-muted/30"
            }`}
          >
            <div className="h-28 w-20 flex-shrink-0 overflow-hidden rounded-md bg-muted">
              {series.coverImage ? (
                <img
                  src={series.coverImage}
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

            <div className="flex-1 min-w-0 flex flex-col">
              <p className="text-sm font-semibold leading-tight line-clamp-1">{series.title}</p>
              {series.author && (
                <p className="text-xs text-muted-foreground mt-0.5">{series.author}</p>
              )}

              <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                {series.publisher && (
                  <span className="rounded-full bg-blue-500/15 px-1.5 py-0.5 text-[10px] font-medium text-blue-400">
                    {series.publisher}
                  </span>
                )}
                {series.editionLabel && (
                  <span className="rounded-full bg-violet-500/15 px-1.5 py-0.5 text-[10px] font-medium text-violet-400">
                    {series.editionLabel}
                  </span>
                )}
                {series.volumeCount > 0 && <span>{series.volumeCount} vol.</span>}
              </div>

              {series.synopsis && (
                <p className="mt-1.5 text-xs text-muted-foreground/70 line-clamp-2 leading-relaxed">
                  {series.synopsis}
                </p>
              )}
            </div>

            <div className="flex-shrink-0 flex flex-col items-end gap-1.5 pt-1">
              <button
                onClick={() => {
                  if (!isOwned) onAdd(series);
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
                href={`/manga/preview/${encodeURIComponent(series.googleBooksId)}`}
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

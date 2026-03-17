"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Search, Plus, X, BookOpen, Loader2, Check, Star } from "lucide-react";
import type { JikanManga } from "@/lib/jikan";

interface AddMangaDialogProps {
  ownedMalIds: Set<number>;
  onAdd: (manga: JikanManga) => void;
}

/**
 * Dialog pour rechercher et ajouter un manga via l'API Jikan.
 */
export function AddMangaDialog({ ownedMalIds, onAdd }: AddMangaDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<JikanManga[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const openDialog = useCallback(() => {
    setOpen(true);
    dialogRef.current?.showModal();
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const closeDialog = useCallback(() => {
    setOpen(false);
    dialogRef.current?.close();
    setQuery("");
    setResults([]);
  }, []);

  // Recherche avec debounce
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/manga/search?q=${encodeURIComponent(query.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data);
        }
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(debounceRef.current);
  }, [query]);

  // Fermer avec Escape
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const handleCancel = () => {
      setOpen(false);
      setQuery("");
      setResults([]);
    };
    dialog.addEventListener("cancel", handleCancel);
    return () => dialog.removeEventListener("cancel", handleCancel);
  }, []);

  return (
    <>
      <button
        onClick={openDialog}
        className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer"
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
        Ajouter un manga
      </button>

      <dialog
        ref={dialogRef}
        className="m-auto w-full max-w-2xl rounded-xl border border-border bg-background p-0 text-foreground backdrop:bg-black/50 backdrop:backdrop-blur-sm"
        aria-label="Rechercher un manga"
      >
        {open && (
          <div className="flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="text-lg font-semibold">Ajouter un manga</h2>
              <button
                onClick={closeDialog}
                aria-label="Fermer"
                className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            {/* Recherche */}
            <div className="px-5 pt-4 pb-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Rechercher un manga..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  aria-label="Rechercher un manga"
                  className="h-10 w-full rounded-lg border border-input bg-background pl-10 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            {/* Résultats */}
            <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-3">
              {loading && (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-hidden="true" />
                  <span className="sr-only">Recherche en cours…</span>
                </div>
              )}

              {!loading && query.trim().length >= 2 && results.length === 0 && (
                <p className="py-12 text-center text-sm text-muted-foreground">
                  Aucun résultat pour &ldquo;{query}&rdquo;
                </p>
              )}

              {!loading && results.map((manga) => {
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

                    {/* Bouton ajouter */}
                    <div className="flex-shrink-0 flex items-start pt-1">
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
                    </div>
                  </div>
                );
              })}

              {!loading && query.trim().length < 2 && (
                <p className="py-12 text-center text-sm text-muted-foreground">
                  Tapez au moins 2 caractères pour rechercher
                </p>
              )}
            </div>
          </div>
        )}
      </dialog>
    </>
  );
}

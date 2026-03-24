"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Search, Plus, X, Loader2 } from "lucide-react";
import { MangaSearchResults } from "./MangaSearchResults";
import { DEMOGRAPHIC_OPTIONS } from "@/lib/utils";
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
  const [demographicFilter, setDemographicFilter] = useState<string>("all");
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
    setDemographicFilter("all");
  }, []);

  const filteredResults = useMemo(() => {
    if (demographicFilter === "all") return results;
    return results.filter((m) => m.demographics?.[0]?.name === demographicFilter);
  }, [results, demographicFilter]);

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

            {/* Filtre démographie */}
            {results.length > 0 && !loading && (
              <div className="flex items-center gap-1.5 px-5 pb-2">
                {DEMOGRAPHIC_OPTIONS.map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setDemographicFilter(value)}
                    aria-pressed={demographicFilter === value}
                    className={`rounded-full px-3 py-1 text-xs font-medium cursor-pointer transition-colors ${
                      demographicFilter === value
                        ? "bg-violet-500 text-white"
                        : "bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}

            {/* Résultats */}
            <div className="flex-1 overflow-y-auto px-5 pb-5">
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

              {!loading && results.length > 0 && filteredResults.length === 0 && (
                <p className="py-12 text-center text-sm text-muted-foreground">
                  Aucun résultat pour ce filtre
                </p>
              )}

              {!loading && filteredResults.length > 0 && (
                <MangaSearchResults results={filteredResults} ownedMalIds={ownedMalIds} onAdd={onAdd} />
              )}

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

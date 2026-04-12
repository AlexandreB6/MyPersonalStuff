"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Search, Plus, X, Loader2, Info } from "lucide-react";
import { MangaSearchResults } from "./MangaSearchResults";
import type { MangaSeries } from "@/lib/google-books";

interface AddMangaDialogProps {
  ownedGoogleBooksIds: Set<string>;
  onAdd: (series: MangaSeries) => void;
}

/**
 * Dialog pour rechercher et ajouter une série manga via Google Books (FR) / BnF.
 */
export function AddMangaDialog({ ownedGoogleBooksIds, onAdd }: AddMangaDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MangaSeries[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<"google-books" | "bnf">("google-books");
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
    setError(null);
    setSource("google-books");
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/manga/search?q=${encodeURIComponent(query.trim())}`);
        if (res.ok) {
          const json = await res.json();
          setResults(json.data);
          setSource(json.source);
        } else {
          setResults([]);
          setError("Impossible de contacter l\u2019API de recherche. Réessayez plus tard.");
        }
      } catch {
        setResults([]);
        setError("Erreur réseau. Vérifiez votre connexion.");
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(debounceRef.current);
  }, [query]);

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
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="text-lg font-semibold">Ajouter un manga (éditions FR)</h2>
              <button
                onClick={closeDialog}
                aria-label="Fermer"
                className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

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
                  className="h-10 w-full rounded-lg border border-input bg-background pl-10 pr-3 text-base sm:text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            {!loading && source === "bnf" && results.length > 0 && (
              <div className="flex items-center gap-2 mx-5 mb-2 rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-2 text-xs text-blue-300">
                <Info className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
                Résultats via BnF (Google Books indisponible)
              </div>
            )}

            <div className="flex-1 overflow-y-auto px-5 pb-5">
              {loading && (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-hidden="true" />
                  <span className="sr-only">Recherche en cours…</span>
                </div>
              )}

              {!loading && !error && query.trim().length >= 2 && results.length === 0 && (
                <p className="py-12 text-center text-sm text-muted-foreground">
                  Aucun résultat pour &ldquo;{query}&rdquo;
                </p>
              )}

              {!loading && error && (
                <p className="py-12 text-center text-sm text-destructive">
                  {error}
                </p>
              )}

              {!loading && results.length > 0 && (
                <MangaSearchResults
                  results={results}
                  ownedGoogleBooksIds={ownedGoogleBooksIds}
                  onAdd={onAdd}
                />
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

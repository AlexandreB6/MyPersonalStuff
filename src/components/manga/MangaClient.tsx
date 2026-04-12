"use client";

import { useState, useMemo, useCallback } from "react";
import { Search, X } from "lucide-react";
import { MangaCard, type MangaItem } from "./MangaCard";
import { AddMangaDialog } from "./AddMangaDialog";
import { ScanMangaDialog } from "./ScanMangaDialog";
import { DEMOGRAPHIC_OPTIONS } from "@/lib/utils";
import type { MangaSeries } from "@/lib/google-books";

interface Props {
  initialMangas: MangaItem[];
}

const STATUS_OPTIONS = [
  { value: "all", label: "Tous" },
  { value: "Publishing", label: "En cours" },
  { value: "Finished", label: "Terminé" },
] as const;

/**
 * Client component principal pour la page Manga.
 * Gère la collection, les filtres et les actions CRUD optimistes.
 */
export function MangaClient({ initialMangas }: Props) {
  const [mangas, setMangas] = useState<MangaItem[]>(initialMangas);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [demographicFilter, setDemographicFilter] = useState<string>("all");

  /** IDs Google Books des mangas possédés — pour le dialog d'ajout */
  const ownedGoogleBooksIds = useMemo(
    () => new Set(mangas.map((m) => m.googleBooksId).filter((id): id is string => id != null)),
    [mangas],
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return mangas.filter((m) => {
      if (statusFilter !== "all" && m.status !== statusFilter) return false;
      if (demographicFilter !== "all" && m.demographic !== demographicFilter) return false;
      if (q && !m.title.toLowerCase().includes(q) && !(m.author?.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [mangas, search, statusFilter, demographicFilter]);

  const hasActiveFilters = search !== "" || statusFilter !== "all" || demographicFilter !== "all";

  const resetFilters = useCallback(() => {
    setSearch("");
    setStatusFilter("all");
    setDemographicFilter("all");
  }, []);

  const addManga = useCallback(async (series: MangaSeries) => {
    const payload = {
      googleBooksId: series.googleBooksId,
      title: series.title,
      titleJapanese: null,
      coverImage: series.coverImage,
      author: series.author,
      publisher: series.publisher,
      editionLabel: series.editionLabel,
      volumes: series.volumeCount > 0 ? series.volumeCount : null,
      synopsis: series.synopsis,
      genres: null,
      demographic: null,
      status: null,
      source: "google-books",
    };

    const res = await fetch("/api/manga", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return;
    const created = await res.json();

    const newManga: MangaItem = {
      ...created,
      ownedVolumesMap: [],
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    };
    setMangas((prev) => [...prev, newManga]);
  }, []);

  const removeManga = useCallback(async (id: number) => {
    setMangas((prev) => prev.filter((m) => m.id !== id));
    await fetch("/api/manga", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
  }, []);

  const totalVolumes = mangas.reduce((sum, m) => sum + m.ownedVolumesMap.length, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight">Manga</h1>
          <p className="text-muted-foreground mt-2 text-lg">
            {mangas.length} manga{mangas.length !== 1 ? "s" : ""} · {totalVolumes} volume{totalVolumes !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <ScanMangaDialog ownedGoogleBooksIds={ownedGoogleBooksIds} onAdd={addManga} />
          <AddMangaDialog ownedGoogleBooksIds={ownedGoogleBooksIds} onAdd={addManga} />
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
        <div className="relative w-full sm:w-56" role="search">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <input
            type="text"
            placeholder="Rechercher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Rechercher dans la collection"
            className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-base sm:text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        <div className="flex items-center gap-1.5">
          {STATUS_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setStatusFilter(value)}
              aria-pressed={statusFilter === value}
              className={`rounded-full px-3 py-1 text-xs font-medium cursor-pointer transition-colors ${
                statusFilter === value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="hidden sm:block h-5 w-px bg-border" aria-hidden="true" />
        <div className="flex items-center gap-1.5">
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
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              aria-label="Réinitialiser les filtres"
              className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium text-destructive bg-destructive/10 hover:bg-destructive/20 cursor-pointer transition-colors"
            >
              <X className="h-3 w-3" aria-hidden="true" />
              Reset
            </button>
          )}
        </div>
      </div>

      <p className="text-sm text-muted-foreground" aria-live="polite">
        {filtered.length} manga{filtered.length !== 1 ? "s" : ""}
      </p>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {filtered.map((manga) => (
          <MangaCard key={manga.id} manga={manga} onRemove={() => removeManga(manga.id)} />
        ))}
      </div>

      {filtered.length === 0 && mangas.length > 0 && (
        <p className="py-12 text-center text-muted-foreground">
          Aucun manga trouvé.
        </p>
      )}

      {mangas.length === 0 && (
        <p className="py-12 text-center text-muted-foreground">
          Aucun manga dans la collection. Cliquez sur &ldquo;Ajouter un manga&rdquo; pour commencer.
        </p>
      )}
    </div>
  );
}

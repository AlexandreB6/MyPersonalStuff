"use client";

import { useState, useMemo, useCallback } from "react";
import { Search, X } from "lucide-react";
import { MangaCard, type MangaItem } from "./MangaCard";
import { AddMangaDialog } from "./AddMangaDialog";
import { ScanMangaDialog } from "./ScanMangaDialog";
import type { JikanManga } from "@/lib/jikan";

interface Props {
  initialMangas: MangaItem[];
}

/** Statuts de filtrage */
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

  /** IDs MAL des mangas possédés — pour le dialog d'ajout */
  const ownedMalIds = useMemo(() => new Set(mangas.map((m) => m.malId)), [mangas]);

  /** Liste filtrée */
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return mangas.filter((m) => {
      if (statusFilter !== "all" && m.status !== statusFilter) return false;
      if (q && !m.title.toLowerCase().includes(q) && !(m.author?.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [mangas, search, statusFilter]);

  const hasActiveFilters = search !== "" || statusFilter !== "all";

  const resetFilters = useCallback(() => {
    setSearch("");
    setStatusFilter("all");
  }, []);

  /** Appel API générique */
  const apiCall = useCallback(
    async (method: string, body: Record<string, unknown>) => {
      await fetch("/api/manga", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    },
    [],
  );

  /** Ajouter un manga depuis les résultats Jikan */
  const addManga = useCallback(
    async (jikan: JikanManga) => {
      const newManga: MangaItem = {
        id: Date.now(),
        malId: jikan.mal_id,
        title: jikan.title,
        titleJapanese: jikan.title_japanese,
        coverImage: jikan.images?.jpg?.large_image_url ?? jikan.images?.jpg?.image_url ?? null,
        author: jikan.authors?.[0]?.name ?? null,
        volumes: jikan.volumes,
        chapters: jikan.chapters,
        synopsis: jikan.synopsis,
        genres: jikan.genres?.map((g) => g.name).join(", ") ?? null,
        demographic: jikan.demographics?.[0]?.name ?? null,
        score: jikan.score,
        status: jikan.status,
        ownedVolumesMap: [],
        notes: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setMangas((prev) => [...prev, newManga]);
      await apiCall("POST", {
        malId: jikan.mal_id,
        title: jikan.title,
        titleJapanese: jikan.title_japanese,
        coverImage: newManga.coverImage,
        author: newManga.author,
        volumes: jikan.volumes,
        chapters: jikan.chapters,
        synopsis: jikan.synopsis,
        genres: newManga.genres,
        demographic: newManga.demographic,
        score: jikan.score,
        status: jikan.status,
      });
    },
    [apiCall],
  );

  /** Ajouter un volume à un manga existant */
  const addVolume = useCallback(
    (malId: number, volume: number) => {
      setMangas((prev) =>
        prev.map((m) => {
          if (m.malId !== malId) return m;
          if (m.ownedVolumesMap.includes(volume)) return m;
          const next = [...m.ownedVolumesMap, volume].sort((a, b) => a - b);
          apiCall("PUT", { malId, ownedVolumesMap: next });
          return { ...m, ownedVolumesMap: next };
        }),
      );
    },
    [apiCall],
  );

  /** Supprimer un manga */
  const removeManga = useCallback(
    (malId: number) => {
      setMangas((prev) => prev.filter((m) => m.malId !== malId));
      apiCall("DELETE", { malId });
    },
    [apiCall],
  );

  const totalVolumes = mangas.reduce((sum, m) => sum + m.ownedVolumesMap.length, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight">Manga</h1>
          <p className="text-muted-foreground mt-2 text-lg">
            {mangas.length} manga{mangas.length !== 1 ? "s" : ""} · {totalVolumes} volume{totalVolumes !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <ScanMangaDialog ownedMalIds={ownedMalIds} onAdd={addManga} onAddVolume={addVolume} mangas={mangas} />
          <AddMangaDialog ownedMalIds={ownedMalIds} onAdd={addManga} />
        </div>
      </div>

      {/* Filtres */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
        <div className="relative w-full sm:w-56" role="search">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <input
            type="text"
            placeholder="Rechercher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Rechercher dans la collection"
            className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
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

      {/* Compteur */}
      <p className="text-sm text-muted-foreground" aria-live="polite">
        {filtered.length} manga{filtered.length !== 1 ? "s" : ""}
      </p>

      {/* Grille */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {filtered.map((manga) => (
          <MangaCard key={manga.malId} manga={manga} onRemove={() => removeManga(manga.malId)} />
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

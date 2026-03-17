"use client";

import { useState, useCallback } from "react";
import { ChevronLeft, Star, BookOpen, Trash2, ExternalLink, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { MangaItem } from "./MangaCard";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { VolumeGrid } from "./VolumeGrid";

interface Props {
  manga: MangaItem;
}

export function MangaDetailClient({ manga: initial }: Props) {
  const router = useRouter();
  const [manga, setManga] = useState(initial);
  const [notes, setNotes] = useState(initial.notes ?? "");
  const [savingNotes, setSavingNotes] = useState(false);
  const [extraVolume, setExtraVolume] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const ownedCount = manga.ownedVolumesMap.length;
  const statusLabel = manga.status === "Finished" ? "Terminé" : manga.status === "Publishing" ? "En cours" : manga.status;
  const genres = manga.genres?.split(", ").filter(Boolean) ?? [];

  const apiCall = useCallback(
    async (body: Record<string, unknown>) => {
      await fetch("/api/manga", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ malId: manga.malId, ...body }),
      });
    },
    [manga.malId],
  );

  const toggleVolume = useCallback(
    (vol: number) => {
      setManga((prev) => {
        const set = new Set(prev.ownedVolumesMap);
        if (set.has(vol)) set.delete(vol);
        else set.add(vol);
        const next = [...set].sort((a, b) => a - b);
        apiCall({ ownedVolumesMap: next });
        return { ...prev, ownedVolumesMap: next };
      });
    },
    [apiCall],
  );

  const addExtraVolume = useCallback(() => {
    const vol = parseInt(extraVolume, 10);
    if (!vol || vol < 1) return;
    setManga((prev) => {
      const set = new Set(prev.ownedVolumesMap);
      set.add(vol);
      const next = [...set].sort((a, b) => a - b);
      apiCall({ ownedVolumesMap: next });
      return { ...prev, ownedVolumesMap: next };
    });
    setExtraVolume("");
  }, [extraVolume, apiCall]);

  const saveNotes = useCallback(async () => {
    setSavingNotes(true);
    await apiCall({ notes: notes || null });
    setSavingNotes(false);
  }, [notes, apiCall]);

  const removeManga = useCallback(async () => {
    await fetch("/api/manga", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ malId: manga.malId }),
    });
    router.push("/manga");
  }, [manga.malId, router]);

  return (
    <div className="space-y-8">
      {/* Breadcrumb */}
      <Link
        href="/manga"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        Collection
      </Link>

      {/* Hero */}
      <div className="flex flex-col sm:flex-row gap-6 sm:gap-8">
        {/* Couverture */}
        <div className="flex-shrink-0 w-48 sm:w-56">
          <div className="relative aspect-[2/3] overflow-hidden rounded-xl border border-border/50 bg-muted shadow-xl">
            {manga.coverImage ? (
              <img
                src={manga.coverImage}
                alt={`Couverture de ${manga.title}`}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <BookOpen className="h-12 w-12 text-muted-foreground/50" aria-hidden="true" />
              </div>
            )}
          </div>
        </div>

        {/* Infos */}
        <div className="flex-1 space-y-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
              {manga.title}
            </h1>
            {manga.titleJapanese && (
              <p className="text-muted-foreground text-lg mt-1">{manga.titleJapanese}</p>
            )}
          </div>

          {manga.author && (
            <p className="text-base text-muted-foreground">par <span className="text-foreground font-medium">{manga.author}</span></p>
          )}

          {/* Métadonnées */}
          <div className="flex flex-wrap items-center gap-3 text-sm">
            {manga.score != null && manga.score > 0 && (
              <span className="inline-flex items-center gap-1.5 bg-amber-500/20 text-amber-400 px-3 py-1 rounded-full font-bold">
                <Star className="w-4 h-4 fill-amber-400" aria-hidden="true" />
                {manga.score.toFixed(1)}
              </span>
            )}
            {statusLabel && (
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                manga.status === "Finished"
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "bg-amber-500/20 text-amber-400"
              }`}>
                {statusLabel}
              </span>
            )}
            {manga.demographic && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-violet-500/20 text-violet-400">
                {manga.demographic}
              </span>
            )}
            {manga.volumes != null && (
              <span className="text-muted-foreground">{manga.volumes} volumes</span>
            )}
            {manga.chapters != null && (
              <span className="text-muted-foreground">{manga.chapters} chapitres</span>
            )}
          </div>

          {/* Genres */}
          {genres.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {genres.map((g) => (
                <span key={g} className="px-3 py-1 rounded-full bg-white/10 text-white/80 text-xs font-medium border border-white/5">
                  {g}
                </span>
              ))}
            </div>
          )}

          {/* Progression */}
          <div className="flex items-center gap-3">
            <div className="text-sm">
              <span className="text-2xl font-bold">{ownedCount}</span>
              {manga.volumes != null && (
                <span className="text-muted-foreground"> / {manga.volumes}</span>
              )}
              <span className="text-muted-foreground ml-1">volumes possédés</span>
            </div>
            {manga.volumes != null && manga.volumes > 0 && (
              <div className="flex-1 max-w-48 h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${Math.min(100, (ownedCount / manga.volumes) * 100)}%` }}
                />
              </div>
            )}
          </div>

          {/* Liens externes */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <a
              href={`https://myanimelist.net/manga/${manga.malId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/15 text-blue-400 hover:bg-blue-500/25 text-xs font-medium transition-colors border border-blue-500/20"
            >
              MyAnimeList
              <ExternalLink className="w-3 h-3" aria-hidden="true" />
            </a>
            <a
              href={`https://anilist.co/search/manga?search=${encodeURIComponent(manga.title)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 text-white/70 hover:bg-white/10 text-xs font-medium transition-colors border border-white/10"
            >
              AniList
              <ExternalLink className="w-3 h-3" aria-hidden="true" />
            </a>
            <a
              href={`https://www.amazon.fr/s?k=${encodeURIComponent(manga.title + " manga")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/15 text-orange-400 hover:bg-orange-500/25 text-xs font-medium transition-colors border border-orange-500/20"
            >
              Amazon
              <ExternalLink className="w-3 h-3" aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>

      {/* Synopsis */}
      {manga.synopsis && (
        <section>
          <h2 className="text-xl font-bold mb-3">Synopsis</h2>
          <p className="text-white/70 leading-relaxed max-w-3xl">{manga.synopsis}</p>
        </section>
      )}

      {/* Grille de volumes */}
      <section>
        <h2 className="text-xl font-bold mb-3">Volumes possédés</h2>
        <VolumeGrid
          totalVolumes={manga.volumes}
          ownedVolumes={manga.ownedVolumesMap}
          onToggle={toggleVolume}
        />
        {(manga.volumes == null || manga.ownedVolumesMap.some((v) => v > (manga.volumes ?? 0))) && (
          <div className="mt-4 flex items-center gap-2">
            <input
              type="number"
              min={1}
              placeholder="N° volume"
              value={extraVolume}
              onChange={(e) => setExtraVolume(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addExtraVolume()}
              className="h-9 w-28 rounded-md border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <button
              onClick={addExtraVolume}
              className="flex items-center gap-1.5 rounded-md bg-primary/10 px-3 py-2 text-xs font-medium text-primary hover:bg-primary/20 transition-colors cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              Ajouter volume
            </button>
          </div>
        )}
      </section>

      {/* Notes */}
      <section>
        <h2 className="text-xl font-bold mb-3">Notes</h2>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={saveNotes}
          placeholder="Ajouter des notes personnelles..."
          rows={4}
          className="w-full max-w-xl rounded-lg border border-input bg-background p-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-y"
        />
        {savingNotes && <p className="text-xs text-muted-foreground mt-1">Sauvegarde...</p>}
      </section>

      {/* Zone danger */}
      <section className="border-t border-border pt-6">
        <button
          onClick={() => setConfirmDelete(true)}
          className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/20 transition-colors cursor-pointer"
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
          Supprimer de ma collection
        </button>
      </section>

      <ConfirmDialog
        open={confirmDelete}
        title="Supprimer ce manga"
        description={`« ${manga.title} » sera retiré de ta collection. Cette action est irréversible.`}
        onConfirm={() => {
          setConfirmDelete(false);
          removeManga();
        }}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}

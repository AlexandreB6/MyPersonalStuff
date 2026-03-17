"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ScanBarcode, X, Loader2, RotateCcw, Check, BookOpen, Star, List } from "lucide-react";
import { MangaSearchResults } from "./MangaSearchResults";
import type { JikanManga } from "@/lib/jikan";

type Phase = "scanning" | "loading" | "confirm" | "results" | "error";

interface ScanMangaDialogProps {
  ownedMalIds: Set<number>;
  onAdd: (manga: JikanManga, opts?: { volume?: number; editionCoverImage?: string }) => void;
  onAddVolume: (malId: number, volume: number) => void;
  onSetEditionCover: (malId: number, url: string) => void;
  mangas: { malId: number; ownedVolumesMap: number[] }[];
}

export function ScanMangaDialog({ ownedMalIds, onAdd, onAddVolume, onSetEditionCover, mangas }: ScanMangaDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const viewfinderRef = useRef<HTMLDivElement>(null);
  const isProcessingRef = useRef(false);

  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>("scanning");
  const [results, setResults] = useState<JikanManga[]>([]);
  const [topResult, setTopResult] = useState<JikanManga | null>(null);
  const [volumeNumber, setVolumeNumber] = useState<number | null>(null);
  const [googleTitle, setGoogleTitle] = useState("");
  const [editionCoverImage, setEditionCoverImage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [isbn, setIsbn] = useState("");
  const lookupIsbnRef = useRef<(isbn: string) => void>(() => {});

  const resetState = useCallback(() => {
    setResults([]);
    setTopResult(null);
    setVolumeNumber(null);
    setEditionCoverImage(null);
    setGoogleTitle("");
    setErrorMsg("");
    setIsbn("");
    isProcessingRef.current = false;
  }, []);

  const stopQuagga = useCallback(async () => {
    try {
      const Quagga = (await import("@ericblade/quagga2")).default;
      Quagga.offDetected();
      Quagga.stop();
    } catch {
      // ignore — Quagga may not have been initialized
    }
  }, []);

  const initQuagga = useCallback(async () => {
    // Wait for DOM to render the viewfinder
    await new Promise((r) => setTimeout(r, 150));
    if (!viewfinderRef.current) return;

    const Quagga = (await import("@ericblade/quagga2")).default;

    await new Promise<void>((resolve, reject) => {
      Quagga.init(
        {
          inputStream: {
            type: "LiveStream",
            target: viewfinderRef.current!,
            constraints: {
              facingMode: "environment",
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
          },
          decoder: {
            readers: ["ean_reader"],
          },
          locate: true,
        },
        (err: unknown) => {
          if (err) reject(err);
          else resolve();
        },
      );
    });

    Quagga.start();

    Quagga.onDetected((result: { codeResult?: { code?: string | null } }) => {
      const code = result?.codeResult?.code;
      if (!code || isProcessingRef.current) return;
      if (code.length !== 13) return;
      isProcessingRef.current = true;
      Quagga.offDetected();
      Quagga.stop();
      lookupIsbnRef.current(code);
    });
  }, []);

  const lookupIsbn = useCallback(async (detectedIsbn: string): Promise<void> => {
    setPhase("loading");
    setIsbn(detectedIsbn);
    try {
      const res = await fetch(`/api/manga/isbn?isbn=${detectedIsbn}`);
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Erreur lors de la recherche");
      }
      const data = await res.json();
      if (!data.results?.length) {
        setErrorMsg("Aucun manga trouvé sur MyAnimeList pour cet ISBN");
        setPhase("error");
        return;
      }
      setResults(data.results);
      setTopResult(data.results[0]);
      setVolumeNumber(data.volumeNumber ?? null);
      setEditionCoverImage(data.editionCoverImage ?? null);
      setGoogleTitle(data.title ?? "");
      setPhase("confirm");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Erreur réseau");
      setPhase("error");
    }
  }, []);

  // Keep ref in sync so initQuagga always calls the latest lookupIsbn
  lookupIsbnRef.current = lookupIsbn;

  const goToScanning = useCallback(async () => {
    resetState();
    setPhase("scanning");
    try {
      await initQuagga();
    } catch (err) {
      const msg =
        err instanceof DOMException && err.name === "NotAllowedError"
          ? "Permission caméra refusée. Autorisez l'accès à la caméra dans les paramètres de votre navigateur."
          : "Impossible de démarrer la caméra";
      setErrorMsg(msg);
      setPhase("error");
    }
  }, [resetState, initQuagga]);

  const closeDialog = useCallback(() => {
    stopQuagga();
    setOpen(false);
    dialogRef.current?.close();
    setPhase("scanning");
    resetState();
  }, [stopQuagga, resetState]);

  const openDialog = useCallback(() => {
    setOpen(true);
    dialogRef.current?.showModal();
  }, []);

  // Start scanner when dialog opens
  useEffect(() => {
    if (open) {
      goToScanning();
    }
  }, [open, goToScanning]);

  // Handle native cancel (Escape)
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const handleCancel = () => {
      stopQuagga();
      setOpen(false);
      setPhase("scanning");
      resetState();
    };
    dialog.addEventListener("cancel", handleCancel);
    return () => dialog.removeEventListener("cancel", handleCancel);
  }, [stopQuagga, resetState]);

  // Check if the volume is already owned
  const isVolumeAlreadyOwned = topResult && volumeNumber != null
    ? mangas.find((m) => m.malId === topResult.mal_id)?.ownedVolumesMap.includes(volumeNumber) ?? false
    : false;

  /** Confirme l'ajout du manga/tome */
  const handleConfirm = () => {
    if (!topResult) return;

    const alreadyOwned = ownedMalIds.has(topResult.mal_id);

    if (alreadyOwned) {
      if (volumeNumber != null) {
        onAddVolume(topResult.mal_id, volumeNumber);
      }
      if (editionCoverImage) {
        onSetEditionCover(topResult.mal_id, editionCoverImage);
      }
    } else {
      onAdd(topResult, {
        volume: volumeNumber ?? undefined,
        editionCoverImage: editionCoverImage ?? undefined,
      });
    }

    goToScanning();
  };

  return (
    <>
      <button
        onClick={openDialog}
        className="flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted transition-colors cursor-pointer"
      >
        <ScanBarcode className="h-4 w-4" aria-hidden="true" />
        Scanner un ISBN
      </button>

      <dialog
        ref={dialogRef}
        className="m-auto w-full max-w-2xl rounded-xl border border-border bg-background p-0 text-foreground backdrop:bg-black/50 backdrop:backdrop-blur-sm"
        aria-label="Scanner un code-barres manga"
      >
        {open && (
          <div className="flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="text-lg font-semibold">
                {phase === "scanning" && "Scanner un code-barres"}
                {phase === "loading" && "Recherche en cours…"}
                {phase === "confirm" && "Confirmer l'ajout"}
                {phase === "results" && "Tous les résultats"}
                {phase === "error" && "Erreur"}
              </h2>
              <button
                onClick={closeDialog}
                aria-label="Fermer"
                className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-5 pb-5 pt-4">
              {/* Scanning phase — camera viewfinder */}
              {phase === "scanning" && (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground text-center">
                    Dirigez la caméra vers le code-barres du manga
                  </p>
                  <div
                    ref={viewfinderRef}
                    className="relative mx-auto aspect-video w-full max-w-md overflow-hidden rounded-lg bg-black [&>video]:h-full [&>video]:w-full [&>video]:object-cover [&>canvas]:absolute [&>canvas]:inset-0 [&>canvas]:h-full [&>canvas]:w-full"
                  />
                </div>
              )}

              {/* Loading phase */}
              {phase === "loading" && (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-hidden="true" />
                  <p className="text-sm text-muted-foreground">
                    Recherche de l&apos;ISBN {isbn}…
                  </p>
                </div>
              )}

              {/* Confirm phase — show top result for validation */}
              {phase === "confirm" && topResult && (
                <div className="space-y-4">
                  {/* Google Books info */}
                  <p className="text-xs text-muted-foreground text-center">
                    ISBN {isbn} → {googleTitle}
                  </p>

                  {/* Manga card preview */}
                  <div className="flex gap-4 rounded-lg border border-primary/30 bg-primary/5 p-4">
                    <div className="h-32 w-22 flex-shrink-0 overflow-hidden rounded-md bg-muted">
                      {topResult.images?.jpg?.image_url ? (
                        <img
                          src={topResult.images.jpg.image_url}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <BookOpen className="h-5 w-5 text-muted-foreground/50" aria-hidden="true" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col">
                      <p className="text-base font-semibold leading-tight">{topResult.title}</p>
                      {topResult.authors?.[0] && (
                        <p className="text-sm text-muted-foreground mt-0.5">{topResult.authors[0].name}</p>
                      )}

                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        {topResult.score != null && topResult.score > 0 && (
                          <span className="inline-flex items-center gap-0.5 text-amber-400 font-medium">
                            <Star className="h-3 w-3 fill-amber-400" aria-hidden="true" />
                            {topResult.score.toFixed(1)}
                          </span>
                        )}
                        {topResult.volumes != null && <span>{topResult.volumes} vol.</span>}
                      </div>

                      {/* Volume badge */}
                      {volumeNumber != null && (
                        <div className="mt-3">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ${
                            isVolumeAlreadyOwned
                              ? "bg-amber-500/15 text-amber-400"
                              : "bg-primary/15 text-primary"
                          }`}>
                            Tome {volumeNumber}
                            {isVolumeAlreadyOwned && " (déjà possédé)"}
                          </span>
                        </div>
                      )}

                      {ownedMalIds.has(topResult.mal_id) && (
                        <p className="mt-1 text-xs text-emerald-400 font-medium">
                          Déjà dans ta collection
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={handleConfirm}
                      disabled={isVolumeAlreadyOwned && ownedMalIds.has(topResult.mal_id)}
                      className="flex items-center justify-center gap-2 w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-default"
                    >
                      <Check className="h-4 w-4" aria-hidden="true" />
                      {ownedMalIds.has(topResult.mal_id)
                        ? volumeNumber != null
                          ? isVolumeAlreadyOwned
                            ? `Tome ${volumeNumber} déjà possédé`
                            : `Ajouter le tome ${volumeNumber}`
                          : "Déjà dans la collection"
                        : volumeNumber != null
                          ? `Ajouter + tome ${volumeNumber}`
                          : "Ajouter à la collection"
                      }
                    </button>

                    <div className="flex gap-2">
                      <button
                        onClick={() => setPhase("results")}
                        className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors cursor-pointer"
                      >
                        <List className="h-4 w-4" aria-hidden="true" />
                        Voir tous les résultats
                      </button>
                      <button
                        onClick={goToScanning}
                        className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors cursor-pointer"
                      >
                        <ScanBarcode className="h-4 w-4" aria-hidden="true" />
                        Re-scanner
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Results phase — all Jikan results */}
              {phase === "results" && (
                <div className="space-y-3">
                  <MangaSearchResults results={results} ownedMalIds={ownedMalIds} onAdd={onAdd} />
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={() => setPhase("confirm")}
                      className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors cursor-pointer"
                    >
                      Retour
                    </button>
                    <button
                      onClick={goToScanning}
                      className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors cursor-pointer"
                    >
                      <ScanBarcode className="h-4 w-4" aria-hidden="true" />
                      Scanner un autre
                    </button>
                  </div>
                </div>
              )}

              {/* Error phase */}
              {phase === "error" && (
                <div className="flex flex-col items-center justify-center py-12 gap-4">
                  <p className="text-sm text-muted-foreground text-center">{errorMsg}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={goToScanning}
                      className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer"
                    >
                      <RotateCcw className="h-4 w-4" aria-hidden="true" />
                      Réessayer
                    </button>
                    <button
                      onClick={closeDialog}
                      className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors cursor-pointer"
                    >
                      Fermer
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </dialog>
    </>
  );
}

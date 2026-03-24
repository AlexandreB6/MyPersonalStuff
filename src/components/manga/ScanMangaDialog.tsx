"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ScanBarcode, X, Loader2, RotateCcw } from "lucide-react";
import { MangaSearchResults } from "./MangaSearchResults";
import type { JikanManga } from "@/lib/jikan";

type Phase = "scanning" | "loading" | "results" | "error";

interface ScanMangaDialogProps {
  ownedMalIds: Set<number>;
  onAdd: (manga: JikanManga) => void;
}

/**
 * Dialog de scan de code-barres manga via la caméra (Quagga2).
 * Flux : caméra → détection EAN-13 → lookup ISBN → résultats Jikan.
 */
export function ScanMangaDialog({ ownedMalIds, onAdd }: ScanMangaDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const viewfinderRef = useRef<HTMLDivElement>(null);
  const isProcessingRef = useRef(false);
  const lookupIsbnRef = useRef<(isbn: string) => void>(() => {});

  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>("scanning");
  const [results, setResults] = useState<JikanManga[]>([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [isbn, setIsbn] = useState("");

  const resetState = useCallback(() => {
    setResults([]);
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
      // ignore
    }
  }, []);

  const initQuagga = useCallback(async () => {
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
          decoder: { readers: ["ean_reader"] },
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

  const lookupIsbn = useCallback(async (detectedIsbn: string) => {
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
      setPhase("results");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Erreur réseau");
      setPhase("error");
    }
  }, []);

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

  useEffect(() => {
    if (open) goToScanning();
  }, [open, goToScanning]);

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
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="text-lg font-semibold">
                {phase === "scanning" && "Scanner un code-barres"}
                {phase === "loading" && "Recherche en cours…"}
                {phase === "results" && `Résultats pour ISBN ${isbn}`}
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

            <div className="flex-1 overflow-y-auto px-5 pb-5 pt-4">
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

              {phase === "loading" && (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-hidden="true" />
                  <p className="text-sm text-muted-foreground">
                    Recherche de l&apos;ISBN {isbn}…
                  </p>
                </div>
              )}

              {phase === "results" && (
                <div className="space-y-3">
                  <MangaSearchResults results={results} ownedMalIds={ownedMalIds} onAdd={onAdd} />
                  <button
                    onClick={goToScanning}
                    className="flex items-center gap-2 mx-auto rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors cursor-pointer"
                  >
                    <ScanBarcode className="h-4 w-4" aria-hidden="true" />
                    Scanner un autre code-barres
                  </button>
                </div>
              )}

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

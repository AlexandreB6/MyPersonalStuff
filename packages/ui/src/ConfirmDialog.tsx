"use client";

import { useRef, useCallback, useEffect } from "react";
import { AlertTriangle, X } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Dialog de confirmation stylé.
 * Utilise <dialog> natif avec showModal() pour le focus trap et le backdrop.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Supprimer",
  cancelLabel = "Annuler",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  // Synchronise l'état ouvert/fermé avec le dialog natif
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);

  // Intercepte l'événement "cancel" (touche Escape) pour fermer proprement
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const handleCancel = (e: Event) => {
      e.preventDefault();
      onCancel();
    };
    dialog.addEventListener("cancel", handleCancel);
    return () => dialog.removeEventListener("cancel", handleCancel);
  }, [onCancel]);

  const handleConfirm = useCallback(() => {
    onConfirm();
  }, [onConfirm]);

  return (
    <dialog
      ref={dialogRef}
      className="m-auto w-full max-w-sm rounded-xl border border-border bg-background p-0 text-foreground backdrop:bg-black/50 backdrop:backdrop-blur-sm"
    >
      {open && (
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" aria-hidden="true" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-semibold">{title}</h3>
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{description}</p>
            </div>
            <button
              onClick={onCancel}
              aria-label="Fermer"
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md hover:bg-muted transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          {/* Actions */}
          <div className="mt-6 flex justify-end gap-2">
            <button
              onClick={onCancel}
              className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              {cancelLabel}
            </button>
            <button
              onClick={handleConfirm}
              autoFocus
              className="rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-white hover:bg-destructive/90 transition-colors cursor-pointer"
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      )}
    </dialog>
  );
}

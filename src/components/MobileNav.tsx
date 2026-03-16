"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Menu, X, Film, Paintbrush } from "lucide-react";

/** Liens de navigation affichés dans le menu mobile */
const NAV_ITEMS = [
  { href: "/", label: "Cinema", icon: Film },
  { href: "/peinture", label: "Peinture", icon: Paintbrush },
];

/**
 * Navigation mobile — menu hamburger visible uniquement sur les petits écrans.
 * Se ferme avec la touche Escape ou au clic sur un lien.
 */
export function MobileNav() {
  const [open, setOpen] = useState(false);

  // Fermer le menu avec la touche Escape
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") setOpen(false);
  }, []);

  useEffect(() => {
    if (open) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [open, handleKeyDown]);

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer transition-colors"
        aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
        aria-expanded={open}
        aria-controls="mobile-nav"
      >
        {open ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
      </button>

      {open && (
        <nav
          id="mobile-nav"
          aria-label="Navigation mobile"
          className="absolute left-0 right-0 top-full border-b border-border/50 bg-background/95 backdrop-blur-xl px-4 pb-4 pt-2 space-y-1"
        >
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {label}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}

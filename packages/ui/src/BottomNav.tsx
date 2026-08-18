"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

export interface NavItem {
  /** Chemin cible, éventuellement avec query string (ex: "/?tab=collection"). */
  href: string;
  label: string;
  /** Élément déjà rendu — un composant ne traverserait pas la frontière serveur/client. */
  icon: ReactNode;
}

/**
 * Barre d'onglets fixée en bas de l'écran, visible uniquement sur mobile.
 * Remplace l'ancien menu hamburger : en mode PWA standalone c'est la zone
 * la plus accessible au pouce.
 */
export function BottomNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // "/?tab=collection" est actif quand le pathname ET le query correspondent.
  function isActive(href: string): boolean {
    const [path, query] = href.split("?");
    if (pathname !== path) return false;
    if (!query) return !searchParams.toString();
    return new URLSearchParams(query).toString() === searchParams.toString();
  }

  return (
    <nav
      aria-label="Navigation principale"
      className="md:hidden fixed bottom-0 inset-x-0 z-50 border-t border-border/50 bg-background/95 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="flex items-stretch">
        {items.map((item) => {
          const active = isActive(item.href);
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors ${
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

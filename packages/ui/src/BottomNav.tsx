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
 * Barre d'onglets flottante (pilule « glass ») en bas de l'écran, mobile uniquement.
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
      className="md:hidden fixed inset-x-0 bottom-0 z-50 px-safe pb-[max(0.75rem,env(safe-area-inset-bottom))] pointer-events-none"
    >
      {/* Pilule flottante en verre, posée au-dessus de la barre d'accueil iOS */}
      <ul className="glass glass-rim relative pointer-events-auto mx-auto flex max-w-sm items-stretch gap-1 rounded-full p-1.5">
        {items.map((item) => {
          const active = isActive(item.href);
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex flex-col items-center gap-0.5 rounded-full py-1.5 text-[11px] font-medium transition-all duration-300 ${
                  active
                    ? "bg-white/15 text-foreground shadow-[inset_0_1px_0_0_rgb(255_255_255/0.25)]"
                    : "text-muted-foreground hover:text-foreground"
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

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/** Fusionne des classes CSS conditionnelles avec clsx puis résout les conflits Tailwind via twMerge. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Génère un slug URL-safe à partir d'un titre et d'un identifiant numérique.
 * Retire les accents, remplace les caractères spéciaux par des tirets.
 * Exemple : makeSlug("Mon Film !", 123) → "mon-film-123"
 */
export function makeSlug(title: string, id: number): string {
  const slug = title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return `${slug}-${id}`;
}

/**
 * Extrait l'identifiant numérique depuis un slug (dernière partie après le dernier tiret).
 * Exemple : extractIdFromSlug("mon-film-123") → 123
 */
export function extractIdFromSlug(slug: string): number {
  const match = slug.match(/-(\d+)$/);
  if (!match) throw new Error("Slug invalide : aucun identifiant trouvé");
  return Number(match[1]);
}

/** Année en cours — constante partagée pour éviter la duplication */
export const CURRENT_YEAR = new Date().getFullYear();

/** Options d'années pour les sélecteurs (descendant depuis l'année en cours) */
export function buildYearOptions(startYear: number): number[] {
  return Array.from({ length: CURRENT_YEAR - startYear + 1 }, (_, i) => CURRENT_YEAR - i);
}

/** Options de démographie manga — partagées entre les composants */
export const DEMOGRAPHIC_OPTIONS = [
  { value: "all", label: "Tous" },
  { value: "Shounen", label: "Shonen" },
  { value: "Shoujo", label: "Shojo" },
  { value: "Seinen", label: "Seinen" },
  { value: "Josei", label: "Josei" },
] as const;

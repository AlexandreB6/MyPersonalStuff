import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/** Fusionne des classes CSS conditionnelles avec clsx puis résout les conflits Tailwind via twMerge. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

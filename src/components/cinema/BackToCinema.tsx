"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

export function BackToCinema() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.back()}
      className="absolute top-4 left-4 sm:left-6 z-10 inline-flex items-center gap-1 text-sm text-white/60 hover:text-white transition-colors bg-black/30 backdrop-blur-sm px-3 py-1.5 rounded-full cursor-pointer"
    >
      <ChevronLeft className="h-4 w-4" aria-hidden="true" />
      Cinéma
    </button>
  );
}

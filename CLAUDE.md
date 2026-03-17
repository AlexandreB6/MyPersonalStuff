# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server (http://localhost:3000)
npm run build    # Production build
npm run start    # Run production build

npx prisma migrate dev --name <name>   # Apply schema changes
npx prisma generate                     # Regenerate client after schema changes
npx prisma studio                       # Browse the database
```

No lint or test scripts are configured.

## Stack

- **Next.js 16** (App Router, TypeScript, `src/` directory)
- **Tailwind CSS v4** + **shadcn/ui v4** (uses `@base-ui/react`, NOT `@radix-ui/react`)
- **Prisma 5** + SQLite (`prisma/dev.db`) — do NOT upgrade to Prisma 7+, incompatible with Node 20
- **TMDB API** for movie metadata
- **Jikan API** (`api.jikan.moe/v4`) for manga metadata (no auth required)
- **lucide-react** for icons
- **Quagga2** (`@ericblade/quagga2`) for barcode scanning (EAN-13/ISBN)

## Architecture

Pages are server components that fetch data via Prisma or external APIs, then pass serialized data to `*Client.tsx` client components. The app is dark-mode only (`<html lang="fr" className="dark">`).

### Homepage (`/`) — "À l'affiche"

Displays now-playing movies from TMDB (fr-FR locale). Server-loads 2 pages (40 movies) with credits, client paginates the rest via `/api/now-playing`. Components: `MovieGrid`, `MovieCard`.

### Movie detail (`/movie/[slug]`)

Slug format: `title-slug-{tmdbId}` (e.g. `mon-film-12345`). Use `slugify()` / `extractIdFromSlug()` from `src/lib/tmdb.ts`.

### Peinture space (`/peinture`)

- Hub page lists paint ranges; each range has its own page at `/peinture/[range]`
- Paint catalog data lives in `src/data/` (static TS files, not DB): `citadel-paints.ts`, `monument-hobbies-paints.ts`, `paint-ranges.ts`, `paint-types.ts`
- `RANGE_MAP` from `src/data/paint-ranges.ts` maps range slugs to their config
- DB tracks only ownership (`OwnedPaint` model) with `paintId` + `range` unique constraint
- Components in `src/components/peinture/` (`PeintureClient.tsx`, `PaintCard.tsx`)
- API route: `/api/paints/`

### Manga space (`/manga`)

- Collection page + detail at `/manga/[slug]` (slug format: `title-slug-{malId}`, uses `extractMalIdFromSlug()` from `src/lib/jikan.ts`)
- Search via Jikan API (MyAnimeList) → add to DB → display collection
- ISBN barcode scanning via Quagga2 → Google Books → Jikan lookup chain
- Tracks owned volumes as JSON array in `ownedVolumesMap` field (e.g. `"[1,2,3,5]"`)
- Components in `src/components/manga/`
- API routes: `/api/manga/` (CRUD), `/api/manga/search/` (Jikan proxy), `/api/manga/isbn/` (ISBN lookup)
- `src/lib/jikan.ts` — Jikan API helpers and types

### API routes summary

- `/api/now-playing/` — proxy for TMDB now-playing (client pagination)
- `/api/paints/` — CRUD for owned paints
- `/api/manga/` — CRUD for manga collection
- `/api/manga/search/` — proxy for Jikan manga search
- `/api/manga/isbn/` — ISBN lookup (Google Books → Jikan search)

### shadcn/ui v4 — critical difference

- No `asChild` prop. Use `render={<Component />}` for composition.
- Example: `<DialogTrigger render={<Button />}>Label</DialogTrigger>`

## Environment

`.env.local` requires:
```
TMDB_API_KEY=...
DATABASE_URL=file:./dev.db
```

## Locale

The app UI and TMDB queries use French (`fr-FR`, region `FR`).

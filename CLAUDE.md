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

Pages are server components that fetch data via Prisma or TMDB, then pass it to `*Client.tsx` client components.

**Homepage (`/`)** — "À l'affiche": displays now-playing movies from TMDB (fr-FR locale). Server-loads 2 pages (40 movies), client paginates the rest via `/api/now-playing`.

**Cinema space (`/cinema`):**
- Server page fetches `Movie` records from DB, serializes dates to ISO strings, passes as `initialMovies` prop
- `CinemaClient` holds movies in state, handles add/delete optimistically
- API routes at `/api/movies/` (GET, POST, PUT, DELETE) mutate the DB
- TMDB calls proxied through `/api/tmdb/` routes to keep the API key server-side

**Movie detail (`/movie/[slug]`)** — slug format: `title-slug-{tmdbId}` (e.g. `mon-film-12345`). Use `slugify()` / `extractIdFromSlug()` from `src/lib/tmdb.ts`.

**Peinture space (`/peinture`):**
- Tracks owned Citadel paints (`OwnedPaint` model) with quantity and notes
- Components in `src/components/peinture/` (`PeintureClient.tsx`, `PaintCard.tsx`)
- API route at `/api/paints/`

**Manga space (`/manga`):**
- Tracks owned mangas (`Manga` model) with volumes count, notes, MAL metadata
- Search via Jikan API (MyAnimeList) → add to DB → display collection
- ISBN barcode scanning via Quagga2 → Google Books → Jikan lookup chain
- Components in `src/components/manga/` (`MangaClient.tsx`, `MangaCard.tsx`, `AddMangaDialog.tsx`, `ScanMangaDialog.tsx`, `MangaSearchResults.tsx`)
- API routes at `/api/manga/` (CRUD) and `/api/manga/search/` (Jikan proxy)
- `src/lib/jikan.ts` — Jikan API helpers and types

**API routes summary:**
- `/api/movies/` — CRUD for personal movie collection
- `/api/tmdb/` — proxy for TMDB search (keeps API key server-side)
- `/api/now-playing/` — proxy for TMDB now-playing (client pagination)
- `/api/paints/` — CRUD for owned paints
- `/api/manga/` — CRUD for manga collection
- `/api/manga/search/` — proxy for Jikan manga search
- `/api/manga/isbn/` — ISBN lookup (Google Books → Jikan search)

**shadcn/ui v4 — critical difference:**
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

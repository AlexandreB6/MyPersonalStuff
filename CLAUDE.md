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
- **Prisma 5** + **Postgres** (Neon, `DATABASE_URL`)
- **TMDB API** for movie metadata
- **Jikan API** (`api.jikan.moe/v4`) for manga metadata (no auth required)
- **lucide-react** for icons
- **Quagga2** (`@ericblade/quagga2`) for barcode scanning (EAN-13/ISBN)

## Architecture

Pages are server components that fetch data via Prisma or external APIs, then pass serialized data to `*Client.tsx` client components. The app is dark-mode only (`<html lang="fr" className="dark">`).

### Homepage (`/`) — Dashboard

Dashboard showing an overview of all spaces (Cinema, Manga, Peinture) with counters and the 5 most recently added items per space. Server component fetching from Prisma.

### Cinema space (`/cinema`)

- Explore TMDB catalog via discover (filters: year, genre, runtime, rating, certification, sort) or text search
- Mark movies as watched with rating (0.5–5 stars, 0.5 step), watched date (day or year precision)
- Two tabs: "Explorer" (TMDB discover grid) and "Films vus" (personal collection)
- Client pagination via `/api/discover/` route
- Components in `src/components/cinema/`: `CinemaClient.tsx`, `MovieCard.tsx`, `MovieGrid.tsx`, `MarkWatchedDialog.tsx`, `WatchedToggle.tsx`, `BackToCinema.tsx`
- `src/lib/tmdb.ts` — TMDB API helpers: `discoverMovies()`, `searchMovies()`, `getMovieWithCredits()`, `getMovieReviews()`, `getGenreList()`, `getDirector()`, `getTopCast()`, `getTrailer()`, `formatRuntime()`

### Movie detail (`/movie/[slug]`)

- Slug format: `title-slug-{tmdbId}` (e.g. `mon-film-12345`). Use `slugify()` / `extractIdFromSlug()` from `src/lib/tmdb.ts`
- Hero backdrop, poster, tagline, metadata (rating, runtime, date, country), genres
- Synopsis, YouTube trailer embed, director, cast (top 12), TMDB reviews
- External links: IMDb, TMDB, AlloCiné, official site
- `WatchedToggle` component for marking watched / editing rating / removing from collection

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
- Components in `src/components/manga/`: `MangaClient.tsx`, `MangaCard.tsx`, `MangaDetailClient.tsx`, `AddMangaDialog.tsx`, `ScanMangaDialog.tsx`, `MangaSearchResults.tsx`, `VolumeGrid.tsx`
- API routes: `/api/manga/` (CRUD), `/api/manga/search/` (Jikan proxy), `/api/manga/isbn/` (ISBN lookup)
- `src/lib/jikan.ts` — Jikan API helpers and types

### API routes summary

- `/api/discover/` — TMDB discover/search proxy with credits enrichment (filters: query, year, genres, runtime, rating, certification, sort)
- `/api/movies/` — CRUD for watched movies collection (POST upsert, PUT update rating/owned/watchedAt, DELETE)
- `/api/now-playing/` — proxy for TMDB now-playing (legacy, client pagination)
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
DATABASE_URL=postgres://...   # Neon connection string
DEMO_MODE=false               # true on the public portfolio deployment
NEXT_PUBLIC_DEMO_MODE=false   # must mirror DEMO_MODE (client-side banner)
CRON_SECRET=...               # only needed on the demo deployment
OWNER_PASSWORD=...             # private mode only — enables the write-gate
```

## Demo mode

The repo is deployed as **two separate Vercel projects** :

- **Private** (personal use) — `DEMO_MODE=false`, full CRUD on the main Neon database.
- **Demo** (public portfolio) — `DEMO_MODE=true`, separate Neon database, each visitor gets an isolated sandbox keyed by a `demo_session` cookie (UUID) set by `src/middleware.ts`.

In demo mode:
- Reads are scoped to `demoSessionId IS NULL` (shared seed) + the visitor's own sid — see `src/lib/demo.ts` (`demoFilter`, `getDemoSessionId`, `assertDemoOwnership`).
- Writes stamp `demoSessionId` with the visitor's cookie (`demoWriteData`). Updates/deletes check ownership and return 403 on mismatch.
- `src/app/api/cron/cleanup-demo/route.ts` runs daily (via `vercel.json`) and purges sandbox rows older than 24 h. It never touches seed rows.
- `src/app/api/demo/reset/route.ts` lets a visitor clear their own sandbox via the `DemoBanner` button.
- Seed data for the demo DB lives in `prisma/seed.ts` — run with `DATABASE_URL=<demo-url> npx tsx prisma/seed.ts`.

Prisma schema notes: `Movie.tmdbId`, `Manga.malId`, and `OwnedPaint.(paintId, range)` use **composite unique indexes** that include `demoSessionId` (so two visitors can add the same film). In private mode, the application layer always filters by `demoSessionId: null` to prevent duplicate inserts.

## Owner write-gate (private mode)

To protect the private deployment from stray visitors, mutating API routes
(`POST`/`PUT`/`DELETE` on `/api/movies`, `/api/manga`, `/api/paints`) are
gated behind an owner cookie when `OWNER_PASSWORD` is set. Reads stay public.

- Login at `/login` (`src/app/login/page.tsx`) → `POST /api/auth/login` verifies
  the password (constant-time) and sets an httpOnly `owner_session` cookie
  containing `sha256(OWNER_PASSWORD)`.
- `src/lib/owner.ts` exposes `ownerGateResponse()` which route handlers call
  at the top of each mutating handler: returns a 401 `NextResponse` or `null`.
- Stateless — no sessions table. Rotating `OWNER_PASSWORD` invalidates every
  existing cookie automatically (hash mismatch).
- Skipped entirely in demo mode and when `OWNER_PASSWORD` is unset (local dev).
- `POST /api/auth/logout` clears the cookie.

## Locale

The app UI and TMDB queries use French (`fr-FR`, region `FR`).

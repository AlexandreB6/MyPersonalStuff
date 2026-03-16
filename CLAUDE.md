# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server (http://localhost:3000)
npm run build    # Production build
npm run start    # Run production build

npx prisma migrate dev --name <name>   # Apply schema changes
npx prisma studio                       # Browse the database
```

No lint or test scripts are configured.

## Stack

- **Next.js 16** (App Router, TypeScript, `src/` directory)
- **Tailwind CSS v4** + **shadcn/ui v4** (uses `@base-ui/react`, NOT `@radix-ui/react`)
- **Prisma 5** + SQLite (`prisma/dev.db`) — do NOT upgrade to Prisma 7+, incompatible with Node 20
- **TMDB API** for movie metadata

## Architecture

Pages are server components that fetch data via Prisma, then pass it to `*Client.tsx` client components. Example: `src/app/cinema/page.tsx` → `CinemaClient.tsx`.

**Data flow for cinema:**
- Server page fetches from DB, serializes dates to ISO strings, passes as `initialMovies` prop
- `CinemaClient` holds movies in state, handles add/delete optimistically
- API routes at `src/app/api/movies/` (GET, POST, PUT, DELETE) mutate the DB
- TMDB calls are proxied through `src/app/api/tmdb/` routes to keep the API key server-side

**shadcn/ui v4 — critical difference:**
- No `asChild` prop. Use `render={<Component />}` for composition.
- Example: `<DialogTrigger render={<Button />}>Label</DialogTrigger>`

## Environment

`.env.local` requires:
```
TMDB_API_KEY=...
DATABASE_URL=file:./dev.db
```

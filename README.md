# MyPersonalStuff

> **[🚀 Essayer la démo en ligne](https://my-personal-stuff-demo.vercel.app/)**

Application web full-stack pour gérer mes collections personnelles : films vus, mangas possédés (avec scan ISBN) et peintures figurines (Citadel, Monument Hobbies). Conçue à l'origine comme un outil personnel, puis ouverte au public en mode démo bac-à-sable.

## Démo publique

Le lien ci-dessus pointe vers une instance de démonstration. Chaque visiteur reçoit automatiquement un **sandbox isolé** (cookie `demo_session`) et peut ajouter, modifier ou supprimer ses propres entrées sans affecter les autres utilisateurs. Un catalogue d'items partagés est pré-chargé pour donner un aperçu immédiat. Les sandbox sont purgés chaque jour par un cron Vercel.

## Features

- **Cinéma** — recherche et découverte TMDB, notation 0.5–5 étoiles, suivi des films vus avec date
- **Manga** — collection MyAnimeList (API Jikan), suivi des volumes possédés, **scan de code-barres ISBN** (Quagga2 + Google Books + Jikan)
- **Peinture** — inventaire multi-gammes (Citadel, Monument Hobbies) avec filtres par type, couleur, métallique, stock
- **Dashboard** — vue d'ensemble avec compteurs et derniers ajouts par espace
- **Mode démo** — sandbox isolés per-user, cron de nettoyage, reset manuel
- **Write-gate propriétaire** — version privée protégée par mot de passe stateless (sha256), reads publics

## Stack technique

- **Next.js 16** (App Router, Server Components, TypeScript)
- **Tailwind CSS v4** + **shadcn/ui v4** (primitives `@base-ui/react`)
- **Prisma 5** + **PostgreSQL** (Neon — branches séparées pour privé et démo)
- **TMDB** API pour les films, **Jikan** (MyAnimeList) pour les mangas
- **Google Books** pour le lookup ISBN
- **Quagga2** pour le scan de code-barres dans le navigateur
- **sonner** pour les toasts d'erreur
- Déployé sur **Vercel** (2 projets : privé + démo), avec cron quotidien

## Architecture

Chaque espace suit le même pattern : un **Server Component** (page) récupère les données via Prisma ou une API externe, puis passe les données sérialisées à un **Client Component** (`*Client.tsx`) qui gère l'état et les interactions. Les mutations passent par des routes API Next.js avec mises à jour optimistes côté client.

Le mode démo repose sur un **middleware proxy** (`src/proxy.ts`) qui injecte un cookie UUID à la première visite, et une lib `src/lib/demo.ts` qui scope tous les reads et writes à la sandbox du visiteur. Les lignes seed (`demoSessionId = NULL`) sont visibles par tous mais non-modifiables — le serveur renvoie un 403 explicite, le client affiche un badge "Catalogue partagé".

## Développement local

```bash
npm install
cp .env.example .env.local   # éditer avec tes clés
npx prisma migrate dev
npm run dev
```

Variables d'environnement requises :

```
TMDB_API_KEY=...
DATABASE_URL=postgres://...
DIRECT_URL=postgres://...    # non-pooled, pour les migrations
DEMO_MODE=false
NEXT_PUBLIC_DEMO_MODE=false
OWNER_PASSWORD=...           # optionnel — active le write-gate
```

-- Add demoSessionId column to Movie, Manga, OwnedPaint for per-visitor sandbox in demo mode.
-- NULL = seed partagé ou prod privée (comportement historique).

-- DropIndex (existing single-column unique constraints, replaced by composite ones below)
DROP INDEX IF EXISTS "Movie_tmdbId_key";
DROP INDEX IF EXISTS "Manga_malId_key";
DROP INDEX IF EXISTS "OwnedPaint_paintId_range_key";

-- AlterTable
ALTER TABLE "Movie" ADD COLUMN IF NOT EXISTS "demoSessionId" TEXT;
ALTER TABLE "Manga" ADD COLUMN IF NOT EXISTS "demoSessionId" TEXT;
ALTER TABLE "OwnedPaint" ADD COLUMN IF NOT EXISTS "demoSessionId" TEXT;

-- CreateIndex (composite uniques — Postgres treats NULLs as distinct, so the
-- application layer is responsible for preventing duplicate inserts in private mode.)
CREATE UNIQUE INDEX "Movie_tmdbId_demoSessionId_key" ON "Movie"("tmdbId", "demoSessionId");
CREATE UNIQUE INDEX "Manga_malId_demoSessionId_key" ON "Manga"("malId", "demoSessionId");
CREATE UNIQUE INDEX "OwnedPaint_paintId_range_demoSessionId_key" ON "OwnedPaint"("paintId", "range", "demoSessionId");

-- CreateIndex (non-unique lookups on demoSessionId for filtering and cleanup)
CREATE INDEX "Movie_demoSessionId_idx" ON "Movie"("demoSessionId");
CREATE INDEX "Manga_demoSessionId_idx" ON "Manga"("demoSessionId");
CREATE INDEX "OwnedPaint_demoSessionId_idx" ON "OwnedPaint"("demoSessionId");

-- Revert of 20260412120000_migrate_manga_to_french_editions
-- Restores malId/chapters/score, drops googleBooksId/publisher/editionLabel/source.
-- Made idempotent so shadow-DB replays (which see only init + this file) are a no-op.

-- DropIndex
DROP INDEX IF EXISTS "Manga_googleBooksId_key";
DROP INDEX IF EXISTS "Manga_title_publisher_editionLabel_key";

-- AlterTable
ALTER TABLE "Manga" DROP COLUMN IF EXISTS "googleBooksId",
DROP COLUMN IF EXISTS "publisher",
DROP COLUMN IF EXISTS "editionLabel",
DROP COLUMN IF EXISTS "source",
ADD COLUMN IF NOT EXISTS "malId" INTEGER,
ADD COLUMN IF NOT EXISTS "chapters" INTEGER,
ADD COLUMN IF NOT EXISTS "score" DOUBLE PRECISION;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Manga_malId_key" ON "Manga"("malId");

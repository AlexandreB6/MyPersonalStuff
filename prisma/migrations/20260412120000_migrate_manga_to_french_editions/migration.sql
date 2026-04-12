-- DropIndex
DROP INDEX "Manga_malId_key";

-- AlterTable
ALTER TABLE "Manga" DROP COLUMN "malId",
DROP COLUMN "chapters",
DROP COLUMN "score",
ADD COLUMN "googleBooksId" TEXT,
ADD COLUMN "publisher" TEXT,
ADD COLUMN "editionLabel" TEXT,
ADD COLUMN "source" TEXT NOT NULL DEFAULT 'google-books';

-- CreateIndex
CREATE UNIQUE INDEX "Manga_googleBooksId_key" ON "Manga"("googleBooksId");

-- CreateIndex
CREATE UNIQUE INDEX "Manga_title_publisher_editionLabel_key" ON "Manga"("title", "publisher", "editionLabel");

/*
  Warnings:

  - You are about to drop the column `editionCoverImage` on the `Manga` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Manga" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "malId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "titleJapanese" TEXT,
    "coverImage" TEXT,
    "author" TEXT,
    "volumes" INTEGER,
    "chapters" INTEGER,
    "synopsis" TEXT,
    "genres" TEXT,
    "demographic" TEXT,
    "score" REAL,
    "status" TEXT,
    "ownedVolumesMap" TEXT NOT NULL DEFAULT '[]',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Manga" ("author", "chapters", "coverImage", "createdAt", "demographic", "genres", "id", "malId", "notes", "ownedVolumesMap", "score", "status", "synopsis", "title", "titleJapanese", "updatedAt", "volumes") SELECT "author", "chapters", "coverImage", "createdAt", "demographic", "genres", "id", "malId", "notes", "ownedVolumesMap", "score", "status", "synopsis", "title", "titleJapanese", "updatedAt", "volumes" FROM "Manga";
DROP TABLE "Manga";
ALTER TABLE "new_Manga" RENAME TO "Manga";
CREATE UNIQUE INDEX "Manga_malId_key" ON "Manga"("malId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateTable
CREATE TABLE "Manga" (
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

-- CreateIndex
CREATE UNIQUE INDEX "Manga_malId_key" ON "Manga"("malId");

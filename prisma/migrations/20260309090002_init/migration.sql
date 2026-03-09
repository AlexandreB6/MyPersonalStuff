-- CreateTable
CREATE TABLE "Movie" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tmdbId" INTEGER,
    "title" TEXT NOT NULL,
    "posterPath" TEXT,
    "overview" TEXT,
    "director" TEXT,
    "releaseYear" INTEGER,
    "watchedAt" DATETIME NOT NULL,
    "rating" INTEGER,
    "owned" BOOLEAN NOT NULL DEFAULT false,
    "ownedFormat" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Movie_tmdbId_key" ON "Movie"("tmdbId");

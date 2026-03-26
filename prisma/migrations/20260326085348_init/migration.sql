-- CreateTable
CREATE TABLE "OwnedPaint" (
    "id" SERIAL NOT NULL,
    "paintId" TEXT NOT NULL,
    "range" TEXT NOT NULL DEFAULT 'citadel',
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OwnedPaint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Manga" (
    "id" SERIAL NOT NULL,
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
    "score" DOUBLE PRECISION,
    "status" TEXT,
    "ownedVolumesMap" TEXT NOT NULL DEFAULT '[]',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Manga_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Movie" (
    "id" SERIAL NOT NULL,
    "tmdbId" INTEGER,
    "title" TEXT NOT NULL,
    "posterPath" TEXT,
    "overview" TEXT,
    "director" TEXT,
    "releaseYear" INTEGER,
    "watchedAt" TIMESTAMP(3),
    "watchedPrecision" TEXT NOT NULL DEFAULT 'day',
    "rating" DOUBLE PRECISION,
    "owned" BOOLEAN NOT NULL DEFAULT false,
    "ownedFormat" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Movie_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OwnedPaint_paintId_range_key" ON "OwnedPaint"("paintId", "range");

-- CreateIndex
CREATE UNIQUE INDEX "Manga_malId_key" ON "Manga"("malId");

-- CreateIndex
CREATE UNIQUE INDEX "Movie_tmdbId_key" ON "Movie"("tmdbId");

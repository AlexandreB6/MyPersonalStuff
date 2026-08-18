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
    "demoSessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Manga_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Manga_demoSessionId_idx" ON "Manga"("demoSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "Manga_malId_demoSessionId_key" ON "Manga"("malId", "demoSessionId");


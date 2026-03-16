-- CreateTable
CREATE TABLE "OwnedPaint" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "paintId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "OwnedPaint_paintId_key" ON "OwnedPaint"("paintId");

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_OwnedPaint" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "paintId" TEXT NOT NULL,
    "range" TEXT NOT NULL DEFAULT 'citadel',
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_OwnedPaint" ("createdAt", "id", "notes", "paintId", "quantity", "updatedAt") SELECT "createdAt", "id", "notes", "paintId", "quantity", "updatedAt" FROM "OwnedPaint";
DROP TABLE "OwnedPaint";
ALTER TABLE "new_OwnedPaint" RENAME TO "OwnedPaint";
CREATE UNIQUE INDEX "OwnedPaint_paintId_range_key" ON "OwnedPaint"("paintId", "range");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

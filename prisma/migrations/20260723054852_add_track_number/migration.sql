-- AlterTable
ALTER TABLE "Artist" ADD COLUMN "photoPath" TEXT;

-- AlterTable
ALTER TABLE "Song" ADD COLUMN "trackNumber" INTEGER;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Playlist" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "imageEnabled" BOOLEAN NOT NULL DEFAULT false,
    "coverImagePath" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "shareToken" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Playlist_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Playlist" ("coverImagePath", "createdAt", "id", "imageEnabled", "name", "ownerId", "updatedAt") SELECT "coverImagePath", "createdAt", "id", "imageEnabled", "name", "ownerId", "updatedAt" FROM "Playlist";
DROP TABLE "Playlist";
ALTER TABLE "new_Playlist" RENAME TO "Playlist";
CREATE UNIQUE INDEX "Playlist_shareToken_key" ON "Playlist"("shareToken");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

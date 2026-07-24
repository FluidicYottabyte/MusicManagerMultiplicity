-- CreateTable
CREATE TABLE "PlaylistSuperShuffle" (
    "userId" TEXT NOT NULL,
    "playlistId" TEXT NOT NULL,

    PRIMARY KEY ("userId", "playlistId"),
    CONSTRAINT "PlaylistSuperShuffle_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PlaylistSuperShuffle_playlistId_fkey" FOREIGN KEY ("playlistId") REFERENCES "Playlist" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

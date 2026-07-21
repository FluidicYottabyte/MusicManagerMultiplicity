import type { Prisma, PrismaClient } from "@prisma/client";
import type { Artist, Album } from "@prisma/client";

type DB = PrismaClient | Prisma.TransactionClient;

/**
 * Case-insensitive find-or-create. SQLite's default collation is
 * case-sensitive and Prisma's `mode: "insensitive"` filter only works on
 * Postgres, so at this friend-group scale we just scan in memory rather
 * than reach for a SQL-level workaround.
 */
export async function resolveArtist(db: DB, name: string): Promise<Artist> {
  const trimmed = name.trim();
  const existing = await db.artist.findMany();
  const match = existing.find((a) => a.name.toLowerCase() === trimmed.toLowerCase());
  if (match) return match;
  return db.artist.create({ data: { name: trimmed } });
}

export async function resolveArtistsFromCommaSeparated(db: DB, raw: string): Promise<Artist[]> {
  const names = raw
    .split(",")
    .map((n) => n.trim())
    .filter((n) => n.length > 0);

  const seen = new Set<string>();
  const artists: Artist[] = [];
  for (const name of names) {
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    artists.push(await resolveArtist(db, name));
  }
  return artists;
}

export async function resolveAlbum(db: DB, name: string | null): Promise<Album | null> {
  if (name === null) return null;
  const trimmed = name.trim();
  if (trimmed.length === 0) return null;
  const existing = await db.album.findMany();
  const match = existing.find((a) => a.name.toLowerCase() === trimmed.toLowerCase());
  if (match) return match;
  return db.album.create({ data: { name: trimmed } });
}

/**
 * `attach`-style pivot insert that tolerates the same artist/album pair
 * already being linked (e.g. two songs by the same artist land in the
 * same album) instead of hitting a unique-constraint error.
 */
export async function attachAlbumArtistIfMissing(db: DB, albumId: string, artistId: string): Promise<void> {
  const existing = await db.albumArtist.findUnique({
    where: { albumId_artistId: { albumId, artistId } },
  });
  if (existing) return;
  await db.albumArtist.create({ data: { albumId, artistId } });
}

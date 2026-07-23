"use server";

import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";

/** Deletes the album itself. Songs in it are kept (albumId just goes back to null - see Song.album's onDelete: SetNull), not deleted. */
export async function deleteAlbum(albumId: string): Promise<void> {
  await requireAdmin();
  await prisma.album.delete({ where: { id: albumId } });
  redirect("/albums");
}

/**
 * Persists a drag-and-drop reorder from the album page by rewriting
 * trackNumber (1-indexed) for the given songs, which is also what album
 * pages sort by - so this doubles as a way to fix missing/wrong track
 * numbers from file metadata. Filters to songs actually in this album so
 * a stale/crafted request can't touch unrelated songs' track numbers.
 */
export async function reorderAlbumSongs(albumId: string, orderedSongIds: string[]): Promise<void> {
  await requireAdmin();

  const albumSongs = await prisma.song.findMany({ where: { albumId }, select: { id: true } });
  const validIds = new Set(albumSongs.map((s) => s.id));

  const ordered = orderedSongIds.filter((id) => validIds.has(id));
  await Promise.all(ordered.map((songId, index) => prisma.song.update({ where: { id: songId }, data: { trackNumber: index + 1 } })));
}

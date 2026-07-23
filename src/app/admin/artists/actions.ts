"use server";

import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * Merges mergeArtistId into keepArtistId: every song/album credited to the
 * duplicate gets re-credited to the keeper (skipping any that are already
 * credited to both, since the pivot tables have a unique constraint), then
 * the duplicate artist row is deleted. Existing playback/library links to
 * the duplicate's songs are untouched - only artist *credit* moves.
 */
export async function mergeArtists(formData: FormData): Promise<void> {
  await requireAdmin();

  const keepArtistId = String(formData.get("keepArtistId") ?? "");
  const mergeArtistId = String(formData.get("mergeArtistId") ?? "");

  if (!keepArtistId || !mergeArtistId || keepArtistId === mergeArtistId) {
    redirect("/admin/artists?error=Choose+two+different+artists");
  }

  const [keep, merge] = await Promise.all([
    prisma.artist.findUnique({ where: { id: keepArtistId } }),
    prisma.artist.findUnique({
      where: { id: mergeArtistId },
      include: { songs: true, albums: true },
    }),
  ]);
  if (!keep || !merge) {
    redirect("/admin/artists?error=Artist+not+found");
  }

  for (const songArtist of merge.songs) {
    const existing = await prisma.songArtist.findUnique({
      where: { songId_artistId: { songId: songArtist.songId, artistId: keepArtistId } },
    });
    if (!existing) {
      await prisma.songArtist.create({ data: { songId: songArtist.songId, artistId: keepArtistId } });
    }
  }

  for (const albumArtist of merge.albums) {
    const existing = await prisma.albumArtist.findUnique({
      where: { albumId_artistId: { albumId: albumArtist.albumId, artistId: keepArtistId } },
    });
    if (!existing) {
      await prisma.albumArtist.create({ data: { albumId: albumArtist.albumId, artistId: keepArtistId } });
    }
  }

  // Carry over the duplicate's photo if the keeper doesn't already have one.
  if (!keep.photoPath && merge.photoPath) {
    await prisma.artist.update({ where: { id: keepArtistId }, data: { photoPath: merge.photoPath } });
  }

  // Cascades any remaining SongArtist/AlbumArtist rows for the duplicate.
  await prisma.artist.delete({ where: { id: mergeArtistId } });

  redirect("/admin/artists?merged=1");
}

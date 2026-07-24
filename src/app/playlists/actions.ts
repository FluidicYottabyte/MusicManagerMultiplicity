"use server";

import { File as NodeFile } from "node:buffer";
import { randomUUID } from "node:crypto";
import { writeFile } from "node:fs/promises";
import path from "node:path";

import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ensureStorageDirectories, StoragePaths } from "@/lib/storage";

const ALLOWED_IMAGE_EXTENSIONS = new Set(["png", "jpg", "jpeg", "gif"]);

async function requireOwnerOrAdmin(playlistId: string) {
  const user = await requireUser();
  const playlist = await prisma.playlist.findUniqueOrThrow({ where: { id: playlistId } });
  if (playlist.ownerId !== user.id && !user.isAdmin) {
    throw new Error("Not authorized to modify this playlist");
  }
  return { user, playlist };
}

async function saveCoverImage(file: NodeFile): Promise<string> {
  const ext = path.extname(file.name).slice(1).toLowerCase();
  if (!ALLOWED_IMAGE_EXTENSIONS.has(ext)) {
    throw new Error("Unsupported image type");
  }
  await ensureStorageDirectories();
  const filename = `${randomUUID()}.${ext}`;
  await writeFile(path.join(StoragePaths.playlistCoverDir, filename), Buffer.from(await file.arrayBuffer()));
  return filename;
}

export async function createPlaylist(formData: FormData): Promise<void> {
  const user = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) redirect("/playlists/new?error=Name+is+required");

  const imageEnabled = formData.get("imageEnabled") === "on";
  const isPublic = formData.get("isPublic") === "on";
  const file = formData.get("coverImage");

  let coverImagePath: string | null = null;
  if (imageEnabled && file instanceof NodeFile && file.size > 0) {
    coverImagePath = await saveCoverImage(file);
  }

  const playlist = await prisma.playlist.create({
    data: { name, ownerId: user.id, imageEnabled, coverImagePath, isPublic },
  });

  redirect(`/playlists/${playlist.id}`);
}

export async function updatePlaylist(playlistId: string, formData: FormData): Promise<void> {
  const { playlist } = await requireOwnerOrAdmin(playlistId);

  const name = String(formData.get("name") ?? "").trim();
  if (!name) redirect(`/playlists/${playlistId}/edit?error=Name+is+required`);

  const imageEnabled = formData.get("imageEnabled") === "on";
  const isPublic = formData.get("isPublic") === "on";
  const file = formData.get("coverImage");

  let coverImagePath = playlist.coverImagePath;
  if (imageEnabled && file instanceof NodeFile && file.size > 0) {
    coverImagePath = await saveCoverImage(file);
  }

  await prisma.playlist.update({
    where: { id: playlistId },
    data: { name, imageEnabled, coverImagePath, isPublic },
  });

  redirect(`/playlists/${playlistId}`);
}

/** Lazily generates and persists a share token the first time it's requested, so old rows don't need a migration backfill. */
export async function getOrCreateShareLink(playlistId: string): Promise<{ token: string }> {
  const { playlist } = await requireOwnerOrAdmin(playlistId);
  if (playlist.shareToken) return { token: playlist.shareToken };

  const token = randomUUID();
  await prisma.playlist.update({ where: { id: playlistId }, data: { shareToken: token } });
  return { token };
}

/**
 * Copies a shared playlist (found by its unguessable token, regardless of
 * its isPublic/ownership) into a brand new private playlist owned by the
 * current user. The original and the copy are entirely independent from
 * that point on - editing one never affects the other.
 */
export async function cloneSharedPlaylist(shareToken: string): Promise<void> {
  const user = await requireUser();

  const source = await prisma.playlist.findUnique({
    where: { shareToken },
    include: { songs: { orderBy: { sortOrder: "asc" } } },
  });
  if (!source) {
    redirect(`/playlists/shared/${shareToken}?error=This+share+link+is+no+longer+valid`);
  }

  const copy = await prisma.playlist.create({
    data: {
      name: source.name,
      ownerId: user.id,
      isPublic: false,
      songs: {
        create: source.songs.map((s) => ({ songId: s.songId, sortOrder: s.sortOrder })),
      },
    },
  });

  redirect(`/playlists/${copy.id}`);
}

export async function deletePlaylist(playlistId: string): Promise<void> {
  await requireOwnerOrAdmin(playlistId);
  await prisma.playlist.delete({ where: { id: playlistId } });
  redirect("/playlists");
}

export async function addSongToPlaylist(playlistId: string, songId: string): Promise<void> {
  await addSongToPlaylistInternal(playlistId, songId);
  redirect(`/playlists/${playlistId}/edit`);
}

async function addSongToPlaylistInternal(playlistId: string, songId: string): Promise<void> {
  await requireOwnerOrAdmin(playlistId);

  const alreadyPresent = await prisma.playlistSong.findUnique({
    where: { playlistId_songId: { playlistId, songId } },
  });
  if (!alreadyPresent) {
    const existingCount = await prisma.playlistSong.count({ where: { playlistId } });
    await prisma.playlistSong.create({ data: { playlistId, songId, sortOrder: existingCount } });
  }
}

/** Adds every song in songIds that isn't already in the playlist (e.g. "add whole album"), preserving the given order. */
export async function quickAddSongsToPlaylist(playlistId: string, songIds: string[]): Promise<{ ok: boolean }> {
  try {
    await requireOwnerOrAdmin(playlistId);

    const existing = await prisma.playlistSong.findMany({
      where: { playlistId, songId: { in: songIds } },
      select: { songId: true },
    });
    const alreadyPresent = new Set(existing.map((e) => e.songId));

    let nextSortOrder = await prisma.playlistSong.count({ where: { playlistId } });
    for (const songId of songIds) {
      if (alreadyPresent.has(songId)) continue;
      await prisma.playlistSong.create({ data: { playlistId, songId, sortOrder: nextSortOrder } });
      nextSortOrder++;
    }

    return { ok: true };
  } catch {
    return { ok: false };
  }
}

/** Returns rather than redirects, for SongList's drag-reorderable playlist editor to call directly. */
export async function removeSongFromPlaylistQuick(playlistId: string, songId: string): Promise<{ ok: boolean }> {
  try {
    await requireOwnerOrAdmin(playlistId);
    await prisma.playlistSong.delete({ where: { playlistId_songId: { playlistId, songId } } });
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

/** Persists a drag-and-drop reorder from the playlist editor by rewriting sortOrder (0-indexed) for the given songs - same pattern as reorderAlbumSongs. */
export async function reorderPlaylistSongs(playlistId: string, orderedSongIds: string[]): Promise<void> {
  await requireOwnerOrAdmin(playlistId);

  const playlistSongs = await prisma.playlistSong.findMany({ where: { playlistId }, select: { songId: true } });
  const validIds = new Set(playlistSongs.map((s) => s.songId));

  const ordered = orderedSongIds.filter((id) => validIds.has(id));
  await Promise.all(
    ordered.map((songId, index) =>
      prisma.playlistSong.update({ where: { playlistId_songId: { playlistId, songId } }, data: { sortOrder: index } })
    )
  );
}

/**
 * Personal "always shuffle this playlist for me" preference - not an edit
 * to the playlist itself, so any signed-in user who can view it may toggle
 * their own preference, regardless of ownership.
 */
export async function toggleSuperShuffle(playlistId: string): Promise<{ enabled: boolean }> {
  const user = await requireUser();

  const existing = await prisma.playlistSuperShuffle.findUnique({
    where: { userId_playlistId: { userId: user.id, playlistId } },
  });

  if (existing) {
    await prisma.playlistSuperShuffle.delete({ where: { userId_playlistId: { userId: user.id, playlistId } } });
    return { enabled: false };
  }

  await prisma.playlistSuperShuffle.create({ data: { userId: user.id, playlistId } });
  return { enabled: true };
}

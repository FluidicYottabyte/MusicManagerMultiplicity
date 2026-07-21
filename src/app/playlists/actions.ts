"use server";

import { File as NodeFile } from "node:buffer";
import { randomUUID } from "node:crypto";
import { writeFile } from "node:fs/promises";
import path from "node:path";

import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ensureStorageDirectories, StoragePaths } from "@/lib/storage";
import { swapIndices } from "@/lib/playlistOrdering";

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
  const file = formData.get("coverImage");

  let coverImagePath: string | null = null;
  if (imageEnabled && file instanceof NodeFile && file.size > 0) {
    coverImagePath = await saveCoverImage(file);
  }

  const playlist = await prisma.playlist.create({
    data: { name, ownerId: user.id, imageEnabled, coverImagePath },
  });

  redirect(`/playlists/${playlist.id}`);
}

export async function updatePlaylist(playlistId: string, formData: FormData): Promise<void> {
  const { playlist } = await requireOwnerOrAdmin(playlistId);

  const name = String(formData.get("name") ?? "").trim();
  if (!name) redirect(`/playlists/${playlistId}/edit?error=Name+is+required`);

  const imageEnabled = formData.get("imageEnabled") === "on";
  const file = formData.get("coverImage");

  let coverImagePath = playlist.coverImagePath;
  if (imageEnabled && file instanceof NodeFile && file.size > 0) {
    coverImagePath = await saveCoverImage(file);
  }

  await prisma.playlist.update({
    where: { id: playlistId },
    data: { name, imageEnabled, coverImagePath },
  });

  redirect(`/playlists/${playlistId}`);
}

export async function deletePlaylist(playlistId: string): Promise<void> {
  await requireOwnerOrAdmin(playlistId);
  await prisma.playlist.delete({ where: { id: playlistId } });
  redirect("/playlists");
}

export async function addSongToPlaylist(playlistId: string, songId: string): Promise<void> {
  await requireOwnerOrAdmin(playlistId);

  const alreadyPresent = await prisma.playlistSong.findUnique({
    where: { playlistId_songId: { playlistId, songId } },
  });
  if (!alreadyPresent) {
    const existingCount = await prisma.playlistSong.count({ where: { playlistId } });
    await prisma.playlistSong.create({ data: { playlistId, songId, sortOrder: existingCount } });
  }

  redirect(`/playlists/${playlistId}/edit`);
}

export async function removeSongFromPlaylist(playlistId: string, songId: string): Promise<void> {
  await requireOwnerOrAdmin(playlistId);
  await prisma.playlistSong.delete({ where: { playlistId_songId: { playlistId, songId } } });
  redirect(`/playlists/${playlistId}/edit`);
}

async function move(playlistId: string, songId: string, direction: -1 | 1): Promise<void> {
  await requireOwnerOrAdmin(playlistId);

  const entries = await prisma.playlistSong.findMany({
    where: { playlistId },
    orderBy: { sortOrder: "asc" },
  });

  const index = entries.findIndex((e) => e.songId === songId);
  const swap = index === -1 ? null : swapIndices(entries.length, index, direction);

  if (swap) {
    const [i, j] = swap;
    const a = entries[i]!;
    const b = entries[j]!;
    await prisma.$transaction([
      prisma.playlistSong.update({
        where: { playlistId_songId: { playlistId: a.playlistId, songId: a.songId } },
        data: { sortOrder: b.sortOrder },
      }),
      prisma.playlistSong.update({
        where: { playlistId_songId: { playlistId: b.playlistId, songId: b.songId } },
        data: { sortOrder: a.sortOrder },
      }),
    ]);
  }

  redirect(`/playlists/${playlistId}/edit`);
}

export async function moveSongUp(playlistId: string, songId: string): Promise<void> {
  await move(playlistId, songId, -1);
}

export async function moveSongDown(playlistId: string, songId: string): Promise<void> {
  await move(playlistId, songId, 1);
}

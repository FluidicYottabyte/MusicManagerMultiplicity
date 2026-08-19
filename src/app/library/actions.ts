"use server";

import { rm } from "node:fs/promises";

import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { saveResizedImage } from "@/lib/images";
import { resolveStoragePath, StoragePaths } from "@/lib/storage";
import { isUploadableFile } from "@/lib/uploadSong";

export async function deleteSong(songId: string): Promise<{ ok: boolean }> {
  await requireAdmin();

  const song = await prisma.song.findUnique({ where: { id: songId } });
  if (!song) return { ok: false };

  await prisma.song.delete({ where: { id: songId } });

  try {
    await rm(resolveStoragePath(song.storedFilename, StoragePaths.audioDir), { force: true });
    if (song.coverImagePath) {
      await rm(resolveStoragePath(song.coverImagePath, StoragePaths.coverDir), { force: true });
    }
  } catch {
    // DB row is already gone; a leftover file on disk is not worth failing the request for.
  }

  // Every page rendering songs is force-dynamic (see the route files), so
  // there's no route cache to invalidate - the next navigation just re-queries.
  return { ok: true };
}

export async function renameSong(songId: string, newTitle: string): Promise<{ ok: boolean }> {
  await requireAdmin();

  const trimmed = newTitle.trim();
  if (!trimmed) return { ok: false };

  await prisma.song.update({ where: { id: songId }, data: { title: trimmed } });
  return { ok: true };
}

export async function setSongCover(songId: string, formData: FormData): Promise<{ ok: boolean }> {
  await requireAdmin();

  const file = formData.get("cover");
  if (!isUploadableFile(file)) return { ok: false };

  let filename: string;
  try {
    filename = await saveResizedImage(file, StoragePaths.coverDir);
  } catch {
    return { ok: false };
  }

  await prisma.song.update({ where: { id: songId }, data: { coverImagePath: filename } });
  return { ok: true };
}

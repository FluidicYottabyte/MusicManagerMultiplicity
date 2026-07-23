"use server";

import { rm } from "node:fs/promises";

import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { resolveStoragePath, StoragePaths } from "@/lib/storage";

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

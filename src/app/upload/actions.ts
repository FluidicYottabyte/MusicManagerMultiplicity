"use server";

import { randomUUID } from "node:crypto";
import { rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";

import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth";
import { attachAlbumArtistIfMissing, resolveAlbum, resolveArtistsFromCommaSeparated } from "@/lib/artistAlbumResolver";
import { prisma } from "@/lib/db";
import { probe } from "@/lib/metadata";
import { ensureStorageDirectories, StoragePaths } from "@/lib/storage";
import { extractCoverArt, transcodeToAAC } from "@/lib/transcode";

const ALLOWED_EXTENSIONS = new Set(["mp3", "m4a", "aac", "flac", "wav", "ogg", "aiff", "aif"]);

function nonEmpty(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function uploadSong(formData: FormData): Promise<void> {
  const user = await requireUser();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    redirect("/upload?error=Please+choose+a+file");
  }

  const ext = path.extname(file.name).slice(1).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    redirect("/upload?error=Unsupported+file+type");
  }

  await ensureStorageDirectories();

  const tmpInputPath = path.join(StoragePaths.tmpDir, `${randomUUID()}.${ext}`);
  await writeFile(tmpInputPath, Buffer.from(await file.arrayBuffer()));

  try {
    const metadata = await probe(tmpInputPath);
    if (!metadata.hasAudioStream) {
      redirect("/upload?error=File+does+not+contain+a+valid+audio+stream");
    }

    const songId = randomUUID();
    const storedFilename = `${songId}.m4a`;
    const outputPath = path.join(StoragePaths.audioDir, storedFilename);

    try {
      await transcodeToAAC(tmpInputPath, outputPath);
    } catch {
      redirect("/upload?error=Transcoding+failed");
    }

    let coverImagePath: string | null = null;
    const coverFilename = `${songId}.jpg`;
    const coverOutputPath = path.join(StoragePaths.coverDir, coverFilename);
    if (await extractCoverArt(tmpInputPath, coverOutputPath)) {
      coverImagePath = coverFilename;
    }

    const title = nonEmpty(formData.get("title")) ?? metadata.title ?? path.parse(file.name).name;
    const artistNamesRaw = nonEmpty(formData.get("artistNames")) ?? metadata.artist;
    const albumNameRaw = nonEmpty(formData.get("albumName")) ?? metadata.album;

    const album = await resolveAlbum(prisma, albumNameRaw);
    const artists = artistNamesRaw ? await resolveArtistsFromCommaSeparated(prisma, artistNamesRaw) : [];

    let fileSizeBytes: number | null = null;
    try {
      fileSizeBytes = (await stat(outputPath)).size;
    } catch {
      // non-fatal; leave null
    }

    await prisma.song.create({
      data: {
        id: songId,
        title,
        albumId: album?.id,
        originalFilename: file.name,
        storedFilename,
        durationSeconds: metadata.durationSeconds,
        coverImagePath,
        fileSizeBytes,
        uploadedById: user.id,
        artists: { create: artists.map((artist) => ({ artistId: artist.id })) },
      },
    });

    if (album) {
      for (const artist of artists) {
        await attachAlbumArtistIfMissing(prisma, album.id, artist.id);
      }
    }
  } finally {
    await rm(tmpInputPath, { force: true });
  }

  redirect("/library");
}

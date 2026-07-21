"use server";

import { File } from "node:buffer";
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

async function uploadOne(
  file: File,
  overrides: { title: string | null; artistNames: string | null; albumName: string | null },
  userId: string
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const ext = path.extname(file.name).slice(1).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return { ok: false, reason: `Unsupported file type: ${file.name}` };
  }

  const tmpInputPath = path.join(StoragePaths.tmpDir, `${randomUUID()}.${ext}`);
  await writeFile(tmpInputPath, Buffer.from(await file.arrayBuffer()));

  try {
    const metadata = await probe(tmpInputPath);
    if (!metadata.hasAudioStream) {
      return { ok: false, reason: `Not a valid audio file: ${file.name}` };
    }

    const songId = randomUUID();
    const storedFilename = `${songId}.m4a`;
    const outputPath = path.join(StoragePaths.audioDir, storedFilename);

    try {
      await transcodeToAAC(tmpInputPath, outputPath);
    } catch {
      return { ok: false, reason: `Transcoding failed: ${file.name}` };
    }

    let coverImagePath: string | null = null;
    const coverFilename = `${songId}.jpg`;
    const coverOutputPath = path.join(StoragePaths.coverDir, coverFilename);
    if (await extractCoverArt(tmpInputPath, coverOutputPath)) {
      coverImagePath = coverFilename;
    }

    const title = overrides.title ?? metadata.title ?? path.parse(file.name).name;
    const artistNamesRaw = overrides.artistNames ?? metadata.artist;
    const albumNameRaw = overrides.albumName ?? metadata.album;

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
        uploadedById: userId,
        artists: { create: artists.map((artist) => ({ artistId: artist.id })) },
      },
    });

    if (album) {
      for (const artist of artists) {
        await attachAlbumArtistIfMissing(prisma, album.id, artist.id);
      }
    }

    return { ok: true };
  } finally {
    await rm(tmpInputPath, { force: true });
  }
}

export async function uploadSong(formData: FormData): Promise<void> {
  const user = await requireUser();

  const files = formData.getAll("file").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0) {
    redirect("/upload?error=Please+choose+at+least+one+file+or+folder");
  }

  await ensureStorageDirectories();

  // Manual title/artist/album overrides only make sense for a single file;
  // for a batch upload every song would otherwise get the same title.
  const overrides =
    files.length === 1
      ? {
          title: nonEmpty(formData.get("title")),
          artistNames: nonEmpty(formData.get("artistNames")),
          albumName: nonEmpty(formData.get("albumName")),
        }
      : { title: null, artistNames: null, albumName: null };

  let succeeded = 0;
  const failures: string[] = [];

  for (const file of files) {
    const result = await uploadOne(file, overrides, user.id);
    if (result.ok) {
      succeeded++;
    } else {
      failures.push(result.reason);
    }
  }

  if (succeeded === 0) {
    redirect(`/upload?error=${encodeURIComponent(failures[0] ?? "Upload failed")}`);
  }

  const params = new URLSearchParams({ uploaded: String(succeeded) });
  if (failures.length > 0) {
    params.set("failed", String(failures.length));
  }
  redirect(`/library?${params.toString()}`);
}

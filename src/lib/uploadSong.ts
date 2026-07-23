import { File as NodeFile } from "node:buffer";
import { randomUUID } from "node:crypto";
import { rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";

import { attachAlbumArtistIfMissing, resolveAlbum, resolveArtistsFromCommaSeparated } from "@/lib/artistAlbumResolver";
import { prisma } from "@/lib/db";
import { probe } from "@/lib/metadata";
import { StoragePaths } from "@/lib/storage";
import { extractCoverArt, transcodeToAAC } from "@/lib/transcode";

const ALLOWED_EXTENSIONS = new Set(["mp3", "m4a", "aac", "flac", "wav", "ogg", "aiff", "aif"]);

export interface UploadOverrides {
  title: string | null;
  artistNames: string | null;
  albumName: string | null;
}

export type UploadResult = { ok: true } | { ok: false; reason: string };

export function isUploadableFile(value: unknown): value is File {
  return value instanceof NodeFile && (value as File).size > 0;
}

export async function uploadSongFile(file: File, overrides: UploadOverrides, userId: string): Promise<UploadResult> {
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
        trackNumber: metadata.trackNumber,
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

/**
 * One-time backfill: re-encodes every cover/photo already on disk down to
 * the same 400px thumbnail size new uploads get (see src/lib/transcode.ts).
 * New uploads are already downsized as of the commit that added this
 * script - this just catches everything uploaded before that.
 *
 * Run with: npm run resize-covers
 *
 * Safe to re-run: files already at/under the target size are left as ffmpeg
 * naturally produces (scale never upscales), and this only ever rewrites
 * files in place - it never touches the database, since filenames don't
 * change.
 */
import { randomUUID } from "node:crypto";
import { readdir, rename, stat } from "node:fs/promises";
import path from "node:path";

import { ensureStorageDirectories, StoragePaths } from "../src/lib/storage";
import { resizeImageToJpeg } from "../src/lib/transcode";

const DIRS = [
  { label: "song covers", dir: StoragePaths.coverDir },
  { label: "album covers", dir: StoragePaths.albumCoverDir },
  { label: "artist photos", dir: StoragePaths.artistPhotoDir },
  { label: "playlist covers", dir: StoragePaths.playlistCoverDir },
];

async function resizeDir(label: string, dir: string): Promise<{ processed: number; before: number; after: number }> {
  let processed = 0;
  let before = 0;
  let after = 0;

  let files: string[];
  try {
    files = await readdir(dir);
  } catch {
    console.log(`  ${label}: directory doesn't exist yet, skipping`);
    return { processed, before, after };
  }

  for (const filename of files) {
    const filePath = path.join(dir, filename);
    const originalSize = (await stat(filePath)).size;

    const tmpPath = path.join(StoragePaths.tmpDir, `${randomUUID()}.jpg`);
    try {
      await resizeImageToJpeg(filePath, tmpPath);
      const newSize = (await stat(tmpPath)).size;
      await rename(tmpPath, filePath);

      processed++;
      before += originalSize;
      after += newSize;
    } catch (err) {
      console.error(`  ${label}: failed on ${filename}:`, err instanceof Error ? err.message : err);
    }
  }

  return { processed, before, after };
}

function formatBytes(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

async function main() {
  await ensureStorageDirectories();

  let totalProcessed = 0;
  let totalBefore = 0;
  let totalAfter = 0;

  for (const { label, dir } of DIRS) {
    console.log(`Resizing ${label}...`);
    const result = await resizeDir(label, dir);
    totalProcessed += result.processed;
    totalBefore += result.before;
    totalAfter += result.after;
    if (result.processed > 0) {
      console.log(`  ${result.processed} file(s): ${formatBytes(result.before)} -> ${formatBytes(result.after)}`);
    }
  }

  console.log(
    `\nDone. ${totalProcessed} file(s) resized: ${formatBytes(totalBefore)} -> ${formatBytes(totalAfter)} (saved ${formatBytes(totalBefore - totalAfter)}).`
  );
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

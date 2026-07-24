import { mkdir } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(process.cwd(), process.env.STORAGE_ROOT ?? "./storage");

export const StoragePaths = {
  root,
  audioDir: path.join(root, "audio"),
  coverDir: path.join(root, "covers"),
  playlistCoverDir: path.join(root, "playlist-covers"),
  artistPhotoDir: path.join(root, "artist-photos"),
  albumCoverDir: path.join(root, "album-covers"),
  tmpDir: path.join(root, "tmp"),
};

export async function ensureStorageDirectories(): Promise<void> {
  await Promise.all(
    [
      StoragePaths.audioDir,
      StoragePaths.coverDir,
      StoragePaths.playlistCoverDir,
      StoragePaths.artistPhotoDir,
      StoragePaths.albumCoverDir,
      StoragePaths.tmpDir,
    ].map((dir) => mkdir(dir, { recursive: true }))
  );
}

/**
 * Resolves a server-generated filename within one of the storage
 * subdirectories, rejecting anything that looks like a path-traversal
 * attempt. Filenames stored in the database are always our own
 * `<uuid>.<ext>` values, but this guard protects any code path that
 * builds a path from user-influenced input.
 */
export function resolveStoragePath(filename: string, dir: string): string {
  if (
    filename.length === 0 ||
    filename.includes("..") ||
    filename.includes("/") ||
    filename.includes("\\") ||
    path.isAbsolute(filename)
  ) {
    throw new Error(`Unsafe filename: ${filename}`);
  }
  const resolved = path.join(dir, filename);
  if (path.dirname(resolved) !== dir) {
    throw new Error(`Unsafe filename: ${filename}`);
  }
  return resolved;
}

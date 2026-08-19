import { File as NodeFile } from "node:buffer";
import { randomUUID } from "node:crypto";
import { createReadStream } from "node:fs";
import { rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { ensureStorageDirectories, resolveStoragePath, StoragePaths } from "@/lib/storage";
import { resizeImageToJpeg } from "@/lib/transcode";

const ALLOWED_IMAGE_EXTENSIONS = new Set(["png", "jpg", "jpeg", "gif"]);

/**
 * Validates and saves an admin-uploaded cover/photo image into destDir,
 * downsizing it via ffmpeg along the way (see resizeImageToJpeg) so full
 * resolution originals never pile up on disk or get shipped to the browser.
 * The output is always a fresh <uuid>.jpg regardless of the input format,
 * matching what every cover-serving route already assumes
 * (Content-Type: image/jpeg).
 */
export async function saveResizedImage(file: NodeFile, destDir: string): Promise<string> {
  if (file.size === 0) {
    throw new Error("No file provided");
  }
  const ext = path.extname(file.name).slice(1).toLowerCase();
  if (!ALLOWED_IMAGE_EXTENSIONS.has(ext)) {
    throw new Error("Unsupported image type");
  }

  await ensureStorageDirectories();
  const tmpInputPath = path.join(StoragePaths.tmpDir, `${randomUUID()}.${ext}`);
  await writeFile(tmpInputPath, Buffer.from(await file.arrayBuffer()));

  try {
    const filename = `${randomUUID()}.jpg`;
    await resizeImageToJpeg(tmpInputPath, path.join(destDir, filename));
    return filename;
  } finally {
    await rm(tmpInputPath, { force: true });
  }
}

/**
 * Shared GET body for the cover/photo routes: resolves filename within dir,
 * redirecting to the default placeholder if there's no image or the file is
 * missing, and otherwise streams it with ETag-based conditional caching -
 * so a browser that already has a given cover skips re-downloading it
 * (a fast 304) on every page it appears on, while still picking up admin
 * changes on the next request instead of being stuck with a stale copy.
 */
export async function serveStoredImage(req: NextRequest, filename: string | null, dir: string): Promise<Response> {
  const fallback = () => NextResponse.redirect(new URL("/images/default-cover.png", req.url));
  if (!filename) return fallback();

  let filePath: string;
  try {
    filePath = resolveStoragePath(filename, dir);
  } catch {
    return fallback();
  }

  let fileStat;
  try {
    fileStat = await stat(filePath);
  } catch {
    return fallback();
  }

  const etag = `"${fileStat.size}-${fileStat.mtimeMs}"`;
  const cacheControl = "private, max-age=300, must-revalidate";
  if (req.headers.get("if-none-match") === etag) {
    return new Response(null, { status: 304, headers: { ETag: etag, "Cache-Control": cacheControl } });
  }

  const stream = Readable.toWeb(createReadStream(filePath)) as ReadableStream;
  return new Response(stream, {
    status: 200,
    headers: { "Content-Type": "image/jpeg", "Cache-Control": cacheControl, ETag: etag },
  });
}

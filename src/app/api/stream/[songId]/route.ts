import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { Readable } from "node:stream";

import type { NextRequest } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { resolveStoragePath, StoragePaths } from "@/lib/storage";

export const runtime = "nodejs";

const MEDIA_TYPE = "audio/mp4"; // AAC-LC in an .m4a container

export async function GET(req: NextRequest, { params }: { params: { songId: string } }) {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const song = await prisma.song.findUnique({ where: { id: params.songId } });
  if (!song) return new Response("Not found", { status: 404 });

  let filePath: string;
  try {
    filePath = resolveStoragePath(song.storedFilename, StoragePaths.audioDir);
  } catch {
    return new Response("Not found", { status: 404 });
  }

  let size: number;
  try {
    size = (await stat(filePath)).size;
  } catch {
    return new Response("Not found", { status: 404 });
  }

  const range = req.headers.get("range");
  if (!range) {
    const stream = Readable.toWeb(createReadStream(filePath)) as ReadableStream;
    return new Response(stream, {
      status: 200,
      headers: {
        "Content-Type": MEDIA_TYPE,
        "Content-Length": String(size),
        "Accept-Ranges": "bytes",
      },
    });
  }

  const match = /^bytes=(\d*)-(\d*)$/.exec(range);
  if (!match) {
    return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
  }

  const [, startStr, endStr] = match;
  let start: number;
  let end: number;
  if (!startStr) {
    // Suffix range, e.g. "bytes=-500" meaning "the last 500 bytes".
    const suffixLength = Number.parseInt(endStr!, 10);
    start = Math.max(0, size - suffixLength);
    end = size - 1;
  } else {
    start = Number.parseInt(startStr, 10);
    end = endStr ? Number.parseInt(endStr, 10) : size - 1;
  }

  if (Number.isNaN(start) || Number.isNaN(end) || start > end || end >= size) {
    return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
  }

  const stream = Readable.toWeb(createReadStream(filePath, { start, end })) as ReadableStream;
  return new Response(stream, {
    status: 206,
    headers: {
      "Content-Type": MEDIA_TYPE,
      "Content-Length": String(end - start + 1),
      "Content-Range": `bytes ${start}-${end}/${size}`,
      "Accept-Ranges": "bytes",
    },
  });
}

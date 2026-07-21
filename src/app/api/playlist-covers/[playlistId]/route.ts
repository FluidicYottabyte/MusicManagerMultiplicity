import { createReadStream } from "node:fs";
import { Readable } from "node:stream";

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { resolveStoragePath, StoragePaths } from "@/lib/storage";

export const runtime = "nodejs";

export async function GET(req: NextRequest, { params }: { params: { playlistId: string } }) {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const playlist = await prisma.playlist.findUnique({ where: { id: params.playlistId } });
  if (!playlist?.imageEnabled || !playlist.coverImagePath) {
    return NextResponse.redirect(new URL("/images/default-cover.png", req.url));
  }

  let filePath: string;
  try {
    filePath = resolveStoragePath(playlist.coverImagePath, StoragePaths.playlistCoverDir);
  } catch {
    return NextResponse.redirect(new URL("/images/default-cover.png", req.url));
  }

  const stream = Readable.toWeb(createReadStream(filePath)) as ReadableStream;
  return new Response(stream, { status: 200, headers: { "Content-Type": "image/jpeg" } });
}

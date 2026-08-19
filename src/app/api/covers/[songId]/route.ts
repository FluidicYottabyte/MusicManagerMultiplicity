import type { NextRequest } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { serveStoredImage } from "@/lib/images";
import { StoragePaths } from "@/lib/storage";

export const runtime = "nodejs";

export async function GET(req: NextRequest, { params }: { params: { songId: string } }) {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const song = await prisma.song.findUnique({ where: { id: params.songId } });
  return serveStoredImage(req, song?.coverImagePath ?? null, StoragePaths.coverDir);
}

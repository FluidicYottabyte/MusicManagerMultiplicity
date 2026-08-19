import type { NextRequest } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { serveStoredImage } from "@/lib/images";
import { StoragePaths } from "@/lib/storage";

export const runtime = "nodejs";

export async function GET(req: NextRequest, { params }: { params: { playlistId: string } }) {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const playlist = await prisma.playlist.findUnique({ where: { id: params.playlistId } });
  const filename = playlist?.imageEnabled ? playlist.coverImagePath : null;
  return serveStoredImage(req, filename, StoragePaths.playlistCoverDir);
}

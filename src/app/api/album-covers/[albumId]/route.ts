import type { NextRequest } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { serveStoredImage } from "@/lib/images";
import { StoragePaths } from "@/lib/storage";

export const runtime = "nodejs";

export async function GET(req: NextRequest, { params }: { params: { albumId: string } }) {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const album = await prisma.album.findUnique({ where: { id: params.albumId } });
  return serveStoredImage(req, album?.coverImagePath ?? null, StoragePaths.albumCoverDir);
}

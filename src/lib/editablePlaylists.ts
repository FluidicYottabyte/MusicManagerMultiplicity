import { prisma } from "@/lib/db";

export interface PlaylistRef {
  id: string;
  name: string;
}

/** Playlists the given user is allowed to add songs to: their own, or all of them if admin. */
export async function getEditablePlaylists(userId: string, isAdmin: boolean): Promise<PlaylistRef[]> {
  return prisma.playlist.findMany({
    where: isAdmin ? {} : { ownerId: userId },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
}

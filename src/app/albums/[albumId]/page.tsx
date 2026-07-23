// This page always reflects live, per-user session and DB state - never statically pre-render it.
export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";

import { SongList } from "@/components/SongList";
import { prisma } from "@/lib/db";
import type { SongView } from "@/types/song";

export default async function AlbumDetailPage({ params }: { params: { albumId: string } }) {
  const album = await prisma.album.findUnique({
    where: { id: params.albumId },
    include: {
      songs: { include: { artists: { include: { artist: true } }, album: true } },
    },
  });

  if (!album) notFound();

  const songs: SongView[] = [...album.songs]
    .sort((a, b) => a.title.localeCompare(b.title))
    .map((song) => ({
      id: song.id,
      title: song.title,
      artistNames: song.artists.map((a) => a.artist.name).join(", "),
      albumName: song.album?.name ?? null,
      coverUrl: song.coverImagePath ? `/api/covers/${song.id}` : "/images/default-cover.png",
    }));

  return (
    <div>
      <h1>{album.name}</h1>
      <SongList songs={songs} emptyMessage="No songs in this album." />
    </div>
  );
}

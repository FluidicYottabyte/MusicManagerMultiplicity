// This page always reflects live, per-user session and DB state - never statically pre-render it.
export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";

import { SongList } from "@/components/SongList";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { SongView } from "@/types/song";

export default async function PlaylistDetailPage({ params }: { params: { playlistId: string } }) {
  const user = await requireUser();
  const playlist = await prisma.playlist.findUnique({
    where: { id: params.playlistId },
    include: {
      owner: true,
      songs: {
        orderBy: { sortOrder: "asc" },
        include: { song: { include: { artists: { include: { artist: true } }, album: true } } },
      },
    },
  });

  if (!playlist) notFound();

  const songs: SongView[] = playlist.songs.map(({ song }) => ({
    id: song.id,
    title: song.title,
    artistNames: song.artists.map((a) => a.artist.name).join(", "),
    albumName: song.album?.name ?? null,
    coverUrl: song.coverImagePath ? `/api/covers/${song.id}` : "/images/default-cover.png",
  }));

  const canEdit = playlist.ownerId === user.id || user.isAdmin;

  return (
    <div>
      <h1>{playlist.name}</h1>
      <p>by {playlist.owner.username}</p>
      {canEdit && (
        <Link href={`/playlists/${playlist.id}/edit`} className="win-button small">
          Edit
        </Link>
      )}
      <SongList songs={songs} emptyMessage="This playlist is empty." />
    </div>
  );
}

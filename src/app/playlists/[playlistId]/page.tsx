// This page always reflects live, per-user session and DB state - never statically pre-render it.
export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";

import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getEditablePlaylists } from "@/lib/editablePlaylists";
import type { SongView } from "@/types/song";

import { PlaylistSongsSection } from "./PlaylistSongsSection";

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
  if (!playlist.isPublic && playlist.ownerId !== user.id && !user.isAdmin) notFound();

  const songs: SongView[] = playlist.songs.map(({ song }) => ({
    id: song.id,
    title: song.title,
    artists: song.artists.map((a) => ({ id: a.artist.id, name: a.artist.name })),
    album: song.album ? { id: song.album.id, name: song.album.name } : null,
    coverUrl: song.coverImagePath ? `/api/covers/${song.id}` : "/images/default-cover.png",
  }));

  const canEdit = playlist.ownerId === user.id || user.isAdmin;
  const editablePlaylists = await getEditablePlaylists(user.id, user.isAdmin);
  const superShuffleRow = await prisma.playlistSuperShuffle.findUnique({
    where: { userId_playlistId: { userId: user.id, playlistId: playlist.id } },
  });

  return (
    <div>
      <h1>{playlist.name}</h1>
      <p>by {playlist.owner.username}</p>
      {canEdit && (
        <Link href={`/playlists/${playlist.id}/edit`} className="win-button small">
          Edit
        </Link>
      )}
      <PlaylistSongsSection
        playlistId={playlist.id}
        songs={songs}
        isAdmin={user.isAdmin}
        editablePlaylists={editablePlaylists}
        initialSuperShuffle={!!superShuffleRow}
      />
    </div>
  );
}

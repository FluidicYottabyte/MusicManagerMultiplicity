// This page always reflects live, per-user session and DB state - never statically pre-render it.
export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";

import { SongList } from "@/components/SongList";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { SongView } from "@/types/song";

import { cloneSharedPlaylist } from "../../actions";

export default async function SharedPlaylistPage({
  params,
  searchParams,
}: {
  params: { token: string };
  searchParams: { error?: string };
}) {
  await requireUser();

  const playlist = await prisma.playlist.findUnique({
    where: { shareToken: params.token },
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
    artists: song.artists.map((a) => ({ id: a.artist.id, name: a.artist.name })),
    album: song.album ? { id: song.album.id, name: song.album.name } : null,
    coverUrl: song.coverImagePath ? `/api/covers/${song.id}` : "/images/default-cover.png",
  }));

  const boundClone = cloneSharedPlaylist.bind(null, params.token);

  return (
    <div>
      <h1>{playlist.name}</h1>
      <p>Shared by {playlist.owner.username}</p>
      {searchParams.error && <div className="error-message">{searchParams.error.replace(/\+/g, " ")}</div>}
      <form action={boundClone} className="win-panel win-raised">
        <p>Add a private copy of this playlist to your own account. Changes to either copy won&apos;t affect the other.</p>
        <button type="submit" className="win-button">
          Add to My Playlists
        </button>
      </form>
      <SongList songs={songs} emptyMessage="This playlist is empty." />
    </div>
  );
}

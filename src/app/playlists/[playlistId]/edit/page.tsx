// This page always reflects live, per-user session and DB state - never statically pre-render it.
export const dynamic = "force-dynamic";

import { notFound, redirect } from "next/navigation";

import { SongList } from "@/components/SongList";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { SongView } from "@/types/song";

import { deletePlaylist, removeSongFromPlaylistQuick, reorderPlaylistSongs, updatePlaylist } from "../../actions";
import { AvailableSongsList } from "./AvailableSongsList";
import { ShareLinkButton } from "./ShareLinkButton";

export default async function EditPlaylistPage({
  params,
  searchParams,
}: {
  params: { playlistId: string };
  searchParams: { error?: string };
}) {
  const user = await requireUser();
  const playlist = await prisma.playlist.findUnique({
    where: { id: params.playlistId },
    include: {
      songs: {
        orderBy: { sortOrder: "asc" },
        include: { song: { include: { artists: { include: { artist: true } }, album: true } } },
      },
    },
  });

  if (!playlist) notFound();
  if (playlist.ownerId !== user.id && !user.isAdmin) {
    redirect(`/playlists/${playlist.id}`);
  }

  const includedIds = new Set(playlist.songs.map((ps) => ps.songId));
  const availableSongs = await prisma.song.findMany({
    where: { id: { notIn: [...includedIds] } },
    include: { artists: { include: { artist: true } } },
    orderBy: { title: "asc" },
  });

  const songs: SongView[] = playlist.songs.map(({ song }) => ({
    id: song.id,
    title: song.title,
    artists: song.artists.map((a) => ({ id: a.artist.id, name: a.artist.name })),
    album: song.album ? { id: song.album.id, name: song.album.name } : null,
    coverUrl: song.coverImagePath ? `/api/covers/${song.id}` : "/images/default-cover.png",
  }));

  const boundUpdate = updatePlaylist.bind(null, playlist.id);

  return (
    <div>
      <h1>Edit Playlist: {playlist.name}</h1>
      {searchParams.error && <div className="error-message">{searchParams.error.replace(/\+/g, " ")}</div>}

      <form action={boundUpdate} className="win-panel win-raised">
        <label htmlFor="name">Name</label>
        <input id="name" type="text" name="name" defaultValue={playlist.name} required />

        <label htmlFor="imageEnabled">
          <input
            id="imageEnabled"
            type="checkbox"
            name="imageEnabled"
            defaultChecked={playlist.imageEnabled}
            style={{ width: "auto", marginRight: 6 }}
          />
          Use custom cover image
        </label>

        <label htmlFor="coverImage">Replace cover image (optional)</label>
        <input id="coverImage" type="file" name="coverImage" accept=".png,.jpg,.jpeg,.gif" />

        <label htmlFor="isPublic">
          <input
            id="isPublic"
            type="checkbox"
            name="isPublic"
            defaultChecked={playlist.isPublic}
            style={{ width: "auto", marginRight: 6 }}
          />
          Public (visible to everyone. Uncheck to make it private, visible only to you)
        </label>

        <button type="submit" className="win-button">
          Save
        </button>
      </form>

      <div className="win-panel win-raised">
        <h3>Share</h3>
        <p>Anyone with this link can view the playlist and add their own private copy of it, whether or not it&apos;s public.</p>
        <ShareLinkButton playlistId={playlist.id} />
      </div>

      <form action={deletePlaylist.bind(null, playlist.id)} className="win-panel win-raised">
        <button type="submit" className="win-button special">
          Delete Playlist
        </button>
      </form>

      <div className="win-panel win-raised">
        <h3>Songs</h3>
        {songs.length === 0 ? (
          <p>No songs yet — add some below.</p>
        ) : (
          <>
            <p>Drag the ⠿ handle to reorder.</p>
            <SongList
              songs={songs}
              isAdmin={user.isAdmin}
              onReorder={reorderPlaylistSongs.bind(null, playlist.id)}
              onRemove={removeSongFromPlaylistQuick.bind(null, playlist.id)}
            />
          </>
        )}
      </div>

      <div className="win-panel win-raised">
        <h3>Add a Song</h3>
        {availableSongs.length === 0 ? (
          <p>All songs in the library are already in this playlist.</p>
        ) : (
          <AvailableSongsList
            playlistId={playlist.id}
            songs={availableSongs.map((s) => ({
              id: s.id,
              title: s.title,
              artistNames: s.artists.map((a) => a.artist.name).join(", "),
            }))}
          />
        )}
      </div>
    </div>
  );
}

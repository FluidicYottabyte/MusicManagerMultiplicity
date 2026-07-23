// This page always reflects live, per-user session and DB state - never statically pre-render it.
export const dynamic = "force-dynamic";

import { notFound, redirect } from "next/navigation";

import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

import {
  addSongToPlaylist,
  deletePlaylist,
  moveSongDown,
  moveSongUp,
  removeSongFromPlaylist,
  updatePlaylist,
} from "../../actions";

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
      songs: { orderBy: { sortOrder: "asc" }, include: { song: { include: { artists: { include: { artist: true } } } } } },
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
          Use a custom cover image
        </label>

        <label htmlFor="coverImage">Replace cover image (optional)</label>
        <input id="coverImage" type="file" name="coverImage" accept=".png,.jpg,.jpeg,.gif" />

        <button type="submit" className="win-button">
          Save
        </button>
      </form>

      <form action={deletePlaylist.bind(null, playlist.id)} className="win-panel win-raised">
        <button type="submit" className="win-button special">
          Delete Playlist
        </button>
      </form>

      <div className="win-panel win-raised">
        <h3>Songs</h3>
        {playlist.songs.length === 0 ? (
          <p>No songs yet — add some below.</p>
        ) : (
          <table className="rows">
            <tbody>
              {playlist.songs.map(({ song }) => (
                <tr key={song.id}>
                  <td>
                    {song.title} — {song.artists.map((a) => a.artist.name).join(", ")}
                  </td>
                  <td>
                    <form action={moveSongUp.bind(null, playlist.id, song.id)} style={{ display: "inline" }}>
                      <button type="submit" className="win-button small">
                        Up
                      </button>
                    </form>
                    <form action={moveSongDown.bind(null, playlist.id, song.id)} style={{ display: "inline" }}>
                      <button type="submit" className="win-button small">
                        Down
                      </button>
                    </form>
                    <form action={removeSongFromPlaylist.bind(null, playlist.id, song.id)} style={{ display: "inline" }}>
                      <button type="submit" className="win-button small">
                        Remove
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="win-panel win-raised">
        <h3>Add a Song</h3>
        {availableSongs.length === 0 ? (
          <p>All songs in the library are already in this playlist.</p>
        ) : (
          <table className="rows">
            <tbody>
              {availableSongs.map((song) => (
                <tr key={song.id}>
                  <td>
                    {song.title} — {song.artists.map((a) => a.artist.name).join(", ")}
                  </td>
                  <td>
                    <form action={addSongToPlaylist.bind(null, playlist.id, song.id)} style={{ display: "inline" }}>
                      <button type="submit" className="win-button small">
                        Add
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

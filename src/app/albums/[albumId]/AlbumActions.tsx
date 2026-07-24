"use client";

import { AddToPlaylistButton } from "@/components/AddToPlaylistButton";
import { usePlayer } from "@/components/PlayerProvider";
import type { PlaylistRef } from "@/lib/editablePlaylists";
import type { SongView } from "@/types/song";

export function AlbumActions({ songs, editablePlaylists }: { songs: SongView[]; editablePlaylists: PlaylistRef[] }) {
  const { playQueue } = usePlayer();

  return (
    <div className="album-actions">
      <button type="button" className="win-button" onClick={() => playQueue(songs, 0)} disabled={songs.length === 0}>
        ▶ Play Album
      </button>
      <AddToPlaylistButton
        songIds={songs.map((s) => s.id)}
        editablePlaylists={editablePlaylists}
        label="+ Add Album to Playlist"
      />
    </div>
  );
}

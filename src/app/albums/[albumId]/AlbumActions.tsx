"use client";

import { useState } from "react";

import { quickAddSongsToPlaylist } from "@/app/playlists/actions";
import { usePlayer } from "@/components/PlayerProvider";
import type { PlaylistRef } from "@/lib/editablePlaylists";
import type { SongView } from "@/types/song";

export function AlbumActions({ songs, editablePlaylists }: { songs: SongView[]; editablePlaylists: PlaylistRef[] }) {
  const { playQueue } = usePlayer();
  const [menuOpen, setMenuOpen] = useState(false);
  const [addedTo, setAddedTo] = useState<Set<string>>(new Set());

  async function handleAdd(playlistId: string) {
    const result = await quickAddSongsToPlaylist(
      playlistId,
      songs.map((s) => s.id)
    );
    if (result.ok) setAddedTo((prev) => new Set(prev).add(playlistId));
  }

  return (
    <div className="album-actions">
      <button type="button" className="win-button" onClick={() => playQueue(songs, 0)} disabled={songs.length === 0}>
        ▶ Play Album
      </button>
      <span className="song-row-actions" style={{ display: "inline-block" }}>
        <button
          type="button"
          className="win-button"
          onClick={() => setMenuOpen((open) => !open)}
          disabled={songs.length === 0}
        >
          + Add Album to Playlist
        </button>
        {menuOpen && (
          <div className="win-raised playlist-popover">
            {editablePlaylists.length === 0 && <div>No editable playlists yet.</div>}
            {editablePlaylists.map((playlist) => (
              <button
                key={playlist.id}
                type="button"
                className="win-button small"
                disabled={addedTo.has(playlist.id)}
                onClick={() => handleAdd(playlist.id)}
              >
                {addedTo.has(playlist.id) ? `Added to ${playlist.name}` : playlist.name}
              </button>
            ))}
          </div>
        )}
      </span>
    </div>
  );
}

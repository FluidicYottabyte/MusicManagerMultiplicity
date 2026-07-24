"use client";

import { useState } from "react";

import { addSongToPlaylist } from "@/app/playlists/actions";

interface AvailableSong {
  id: string;
  title: string;
  artistNames: string;
}

export function AvailableSongsList({ playlistId, songs }: { playlistId: string; songs: AvailableSong[] }) {
  const [filter, setFilter] = useState("");

  const visible = filter
    ? songs.filter((s) => `${s.title} ${s.artistNames}`.toLowerCase().includes(filter.toLowerCase()))
    : songs;

  return (
    <div>
      <input type="search" value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Search songs to add" />
      {visible.length === 0 ? (
        <p>No matching songs.</p>
      ) : (
        <table className="rows">
          <tbody>
            {visible.map((song) => (
              <tr key={song.id}>
                <td>
                  {song.title} — {song.artistNames}
                </td>
                <td>
                  <form action={addSongToPlaylist.bind(null, playlistId, song.id)} style={{ display: "inline" }}>
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
  );
}

"use client";

import { usePlayer } from "@/components/PlayerProvider";
import type { SongView } from "@/types/song";

export function SongList({ songs, emptyMessage }: { songs: SongView[]; emptyMessage?: string }) {
  const { playQueue, current } = usePlayer();

  if (songs.length === 0) {
    return <p>{emptyMessage ?? "No songs here yet."}</p>;
  }

  return (
    <div className="win-sunken song-list">
      <table className="rows">
        <tbody>
          {songs.map((song, index) => (
            <tr
              key={song.id}
              className={current?.id === song.id ? "selected" : undefined}
              onClick={() => playQueue(songs, index)}
            >
              <td>
                <img className="thumb" src={song.coverUrl} alt="" />
              </td>
              <td>
                <div>{song.title}</div>
                <div>
                  {song.artistNames}
                  {song.albumName ? ` — ${song.albumName}` : ""}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

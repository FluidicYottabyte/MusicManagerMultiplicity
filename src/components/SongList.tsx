"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { usePlayer } from "@/components/PlayerProvider";
import { deleteSong } from "@/app/library/actions";
import { quickAddSongToPlaylist } from "@/app/playlists/actions";
import type { PlaylistRef } from "@/lib/editablePlaylists";
import type { SongView } from "@/types/song";

interface SongListProps {
  songs: SongView[];
  emptyMessage?: string;
  isAdmin?: boolean;
  editablePlaylists?: PlaylistRef[];
  /** When provided, rows get a drag handle; dropping calls this with the full new song-id order to persist. */
  onReorder?: (orderedSongIds: string[]) => void;
}

export function SongList({ songs: initialSongs, emptyMessage, isAdmin, editablePlaylists, onReorder }: SongListProps) {
  const { playQueue, current } = usePlayer();
  const [songs, setSongs] = useState(initialSongs);
  const [openMenuFor, setOpenMenuFor] = useState<string | null>(null);
  const [addedTo, setAddedTo] = useState<Set<string>>(new Set());
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  useEffect(() => setSongs(initialSongs), [initialSongs]);

  if (songs.length === 0) {
    return <p>{emptyMessage ?? "No songs here yet."}</p>;
  }

  async function handleDelete(songId: string) {
    if (!window.confirm("Delete this song for everyone? This cannot be undone.")) return;
    const result = await deleteSong(songId);
    if (result.ok) {
      setSongs((prev) => prev.filter((s) => s.id !== songId));
    }
  }

  async function handleAddToPlaylist(playlistId: string, songId: string) {
    const result = await quickAddSongToPlaylist(playlistId, songId);
    if (result.ok) {
      setAddedTo((prev) => new Set(prev).add(`${playlistId}:${songId}`));
    }
  }

  function handleDrop(dropIndex: number) {
    if (draggedIndex === null || draggedIndex === dropIndex || !onReorder) {
      setDraggedIndex(null);
      return;
    }
    const reordered = [...songs];
    const [moved] = reordered.splice(draggedIndex, 1);
    reordered.splice(dropIndex, 0, moved!);
    setSongs(reordered);
    setDraggedIndex(null);
    onReorder(reordered.map((s) => s.id));
  }

  return (
    <div className="win-sunken song-list">
      <table className="rows">
        <tbody>
          {songs.map((song, index) => (
            <tr
              key={song.id}
              className={current?.id === song.id ? "selected" : undefined}
              onDragOver={onReorder ? (e) => e.preventDefault() : undefined}
              onDrop={onReorder ? () => handleDrop(index) : undefined}
            >
              {onReorder && (
                <td
                  className="drag-handle"
                  draggable
                  onDragStart={() => setDraggedIndex(index)}
                  onDragEnd={() => setDraggedIndex(null)}
                >
                  ⠿
                </td>
              )}
              <td
                onClick={() => {
                  playQueue(songs, index);
                  setOpenMenuFor(null);
                }}
              >
                <img className="thumb" src={song.coverUrl} alt="" />
              </td>
              <td
                onClick={() => {
                  playQueue(songs, index);
                  setOpenMenuFor(null);
                }}
              >
                <div>{song.title}</div>
                <div className="song-row-links">
                  {song.artists.map((artist, i) => (
                    <span key={artist.id}>
                      {i > 0 && ", "}
                      <Link href={`/artists/${artist.id}`} onClick={(e) => e.stopPropagation()}>
                        {artist.name}
                      </Link>
                    </span>
                  ))}
                  {song.album && (
                    <>
                      {" — "}
                      <Link href={`/albums/${song.album.id}`} onClick={(e) => e.stopPropagation()}>
                        {song.album.name}
                      </Link>
                    </>
                  )}
                </div>
              </td>
              <td className="song-row-actions">
                {editablePlaylists && (
                  <>
                    <button
                      type="button"
                      className="win-button small"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuFor((cur) => (cur === song.id ? null : song.id));
                      }}
                    >
                      + Playlist
                    </button>
                    {openMenuFor === song.id && (
                      <div className="win-raised playlist-popover" onClick={(e) => e.stopPropagation()}>
                        {editablePlaylists.length === 0 && <div>No editable playlists yet.</div>}
                        {editablePlaylists.map((playlist) => {
                          const key = `${playlist.id}:${song.id}`;
                          return (
                            <button
                              key={playlist.id}
                              type="button"
                              className="win-button small"
                              disabled={addedTo.has(key)}
                              onClick={() => handleAddToPlaylist(playlist.id, song.id)}
                            >
                              {addedTo.has(key) ? `Added to ${playlist.name}` : playlist.name}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
                {isAdmin && (
                  <button
                    type="button"
                    className="win-button small"
                    onClick={(e) => {
                      e.stopPropagation();
                      void handleDelete(song.id);
                    }}
                  >
                    Delete
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

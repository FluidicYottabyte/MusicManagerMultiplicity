"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { AddToPlaylistButton } from "@/components/AddToPlaylistButton";
import { usePlayer } from "@/components/PlayerProvider";
import { deleteSong, renameSong, setSongCover } from "@/app/library/actions";
import type { PlaylistRef } from "@/lib/editablePlaylists";
import type { SongView } from "@/types/song";

interface SongListProps {
  songs: SongView[];
  emptyMessage?: string;
  isAdmin?: boolean;
  editablePlaylists?: PlaylistRef[];
  /** When provided, rows get a drag handle; dropping calls this with the full new song-id order to persist. */
  onReorder?: (orderedSongIds: string[]) => void;
  /** When true, clicking a row plays that song first, then shuffles the rest of the list (see PlaylistSuperShuffle). */
  superShuffle?: boolean;
}

export function SongList({
  songs: initialSongs,
  emptyMessage,
  isAdmin,
  editablePlaylists,
  onReorder,
  superShuffle,
}: SongListProps) {
  const { playQueue, current } = usePlayer();
  const [songs, setSongs] = useState(initialSongs);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [coverTargetId, setCoverTargetId] = useState<string | null>(null);

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

  async function handleRename(songId: string, currentTitle: string) {
    const newTitle = window.prompt("New title:", currentTitle);
    if (!newTitle || newTitle.trim() === currentTitle) return;
    const result = await renameSong(songId, newTitle);
    if (result.ok) {
      setSongs((prev) => prev.map((s) => (s.id === songId ? { ...s, title: newTitle.trim() } : s)));
    }
  }

  function handleCoverButtonClick(songId: string) {
    setCoverTargetId(songId);
    coverInputRef.current?.click();
  }

  async function handleCoverFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !coverTargetId) return;
    const targetId = coverTargetId;
    const formData = new FormData();
    formData.set("cover", file);
    const result = await setSongCover(targetId, formData);
    if (result.ok) {
      setSongs((prev) =>
        prev.map((s) => (s.id === targetId ? { ...s, coverUrl: `/api/covers/${s.id}?v=${Date.now()}` } : s))
      );
    }
    setCoverTargetId(null);
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

  function handlePlay(index: number) {
    playQueue(songs, index, { forceShuffle: superShuffle });
  }

  return (
    <div className="win-sunken song-list">
      <input type="file" accept="image/*" ref={coverInputRef} style={{ display: "none" }} onChange={handleCoverFileChange} />
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
              <td onClick={() => handlePlay(index)}>
                <img className="thumb" src={song.coverUrl} alt="" />
              </td>
              <td onClick={() => handlePlay(index)}>
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
              <td className="song-row-actions" onClick={(e) => e.stopPropagation()}>
                {editablePlaylists && <AddToPlaylistButton songIds={[song.id]} editablePlaylists={editablePlaylists} />}
                {isAdmin && (
                  <>
                    <button
                      type="button"
                      className="win-button small"
                      onClick={() => void handleRename(song.id, song.title)}
                    >
                      Rename
                    </button>
                    <button type="button" className="win-button small" onClick={() => handleCoverButtonClick(song.id)}>
                      Cover
                    </button>
                    <button type="button" className="win-button small" onClick={() => void handleDelete(song.id)}>
                      Delete
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

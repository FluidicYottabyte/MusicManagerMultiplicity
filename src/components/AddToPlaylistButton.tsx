"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { quickAddSongsToPlaylist } from "@/app/playlists/actions";
import type { PlaylistRef } from "@/lib/editablePlaylists";

/**
 * Renders its popover through a portal into document.body, positioned via
 * the trigger button's own bounding rect rather than CSS position:absolute
 * relative to an ancestor. It previously lived inside table cells with an
 * overflow-y:auto ancestor (.song-list), which clipped the popover for
 * rows near the bottom (worst case: a one-song list, where it was nearly
 * impossible to see at all) - a portal escapes that clipping entirely.
 */
export function AddToPlaylistButton({
  songIds,
  editablePlaylists,
  label = "+ Playlist",
}: {
  songIds: string[];
  editablePlaylists: PlaylistRef[];
  label?: string;
}) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const [filter, setFilter] = useState("");
  const [addedTo, setAddedTo] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!open) return;
    const handleOutside = () => setOpen(false);
    document.addEventListener("click", handleOutside);
    return () => document.removeEventListener("click", handleOutside);
  }, [open]);

  function toggleOpen(e: React.MouseEvent) {
    e.stopPropagation();
    if (!open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const popoverWidth = 220;
      const left = Math.min(rect.right + window.scrollX - popoverWidth, window.innerWidth - popoverWidth - 8);
      setPosition({ top: rect.bottom + window.scrollY + 4, left: Math.max(8, left) });
      setFilter("");
    }
    setOpen((o) => !o);
  }

  async function handleAdd(playlistId: string) {
    const result = await quickAddSongsToPlaylist(playlistId, songIds);
    if (result.ok) setAddedTo((prev) => new Set(prev).add(playlistId));
  }

  const visiblePlaylists = filter
    ? editablePlaylists.filter((p) => p.name.toLowerCase().includes(filter.toLowerCase()))
    : editablePlaylists;

  return (
    <>
      <button
        type="button"
        ref={buttonRef}
        className="win-button small"
        onClick={toggleOpen}
        disabled={songIds.length === 0}
      >
        {label}
      </button>
      {open &&
        position &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="win-raised playlist-popover"
            style={{ position: "absolute", top: position.top, left: position.left }}
            onClick={(e) => e.stopPropagation()}
          >
            {editablePlaylists.length === 0 && <div>No editable playlists yet.</div>}
            {editablePlaylists.length > 5 && (
              <input
                type="search"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Filter playlists"
                autoFocus
              />
            )}
            {visiblePlaylists.map((playlist) => (
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
          </div>,
          document.body
        )}
    </>
  );
}

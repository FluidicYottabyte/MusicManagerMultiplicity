"use client";

import { useState } from "react";

import { toggleSuperShuffle } from "@/app/playlists/actions";
import { SongList } from "@/components/SongList";
import type { PlaylistRef } from "@/lib/editablePlaylists";
import type { SongView } from "@/types/song";

export function PlaylistSongsSection({
  playlistId,
  songs,
  isAdmin,
  editablePlaylists,
  initialSuperShuffle,
}: {
  playlistId: string;
  songs: SongView[];
  isAdmin: boolean;
  editablePlaylists: PlaylistRef[];
  initialSuperShuffle: boolean;
}) {
  const [superShuffle, setSuperShuffle] = useState(initialSuperShuffle);

  async function handleToggle() {
    const result = await toggleSuperShuffle(playlistId);
    setSuperShuffle(result.enabled);
  }

  return (
    <div>
      <button type="button" className={`win-button small${superShuffle ? " special" : ""}`} onClick={handleToggle}>
        {superShuffle ? "Super Shuffle: On" : "Super Shuffle: Off"}
      </button>
      <p>
        {superShuffle
          ? "This plays shuffled for you personally, no matter which song you click - other people see it in normal order."
          : "Turn this on to always play this playlist shuffled, just for you."}
      </p>
      <SongList
        songs={songs}
        emptyMessage="This playlist is empty."
        isAdmin={isAdmin}
        editablePlaylists={editablePlaylists}
        superShuffle={superShuffle}
      />
    </div>
  );
}

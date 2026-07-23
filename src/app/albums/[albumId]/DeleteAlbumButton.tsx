"use client";

import { deleteAlbum } from "../actions";

export function DeleteAlbumButton({ albumId }: { albumId: string }) {
  return (
    <button
      type="button"
      className="win-button special"
      onClick={() => {
        if (window.confirm("Delete this album? Its songs stay in your library, just no longer grouped under it.")) {
          void deleteAlbum(albumId);
        }
      }}
    >
      Delete Album
    </button>
  );
}

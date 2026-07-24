"use client";

import { useRouter } from "next/navigation";
import { useRef } from "react";

import { renameAlbum, setAlbumCover } from "../actions";

export function AlbumAdminControls({ albumId, name }: { albumId: string; name: string }) {
  const router = useRouter();
  const coverInputRef = useRef<HTMLInputElement>(null);

  async function handleRename() {
    const newName = window.prompt("New album name:", name);
    if (!newName || newName.trim() === name) return;
    const result = await renameAlbum(albumId, newName);
    if (result.ok) router.refresh();
  }

  async function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const formData = new FormData();
    formData.set("cover", file);
    const result = await setAlbumCover(albumId, formData);
    if (result.ok) router.refresh();
  }

  return (
    <div className="album-actions">
      <button type="button" className="win-button small" onClick={handleRename}>
        Rename Album
      </button>
      <button type="button" className="win-button small" onClick={() => coverInputRef.current?.click()}>
        Change Cover
      </button>
      <input type="file" accept="image/*" ref={coverInputRef} style={{ display: "none" }} onChange={handleCoverChange} />
    </div>
  );
}

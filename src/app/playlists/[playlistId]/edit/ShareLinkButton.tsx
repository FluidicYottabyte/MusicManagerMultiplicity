"use client";

import { useState } from "react";

import { getOrCreateShareLink } from "@/app/playlists/actions";

export function ShareLinkButton({ playlistId }: { playlistId: string }) {
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleClick() {
    const { token } = await getOrCreateShareLink(playlistId);
    setLink(`${window.location.origin}/playlists/shared/${token}`);
    setCopied(false);
  }

  async function handleCopy() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
    } catch {
      // Clipboard API needs a secure (https) context in most browsers;
      // the read-only input below still lets the user select & copy manually.
    }
  }

  return (
    <div>
      <button type="button" className="win-button small" onClick={handleClick}>
        Get Share Link
      </button>
      {link && (
        <div className="win-sunken share-link-box">
          <input type="text" readOnly value={link} onFocus={(e) => e.target.select()} />
          <button type="button" className="win-button small" onClick={handleCopy}>
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      )}
    </div>
  );
}

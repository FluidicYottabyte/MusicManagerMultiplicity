import Link from "next/link";

import { LogoutButton } from "@/components/LogoutButton";

export function NavBar({ username, isAdmin }: { username: string; isAdmin: boolean }) {
  return (
    <nav className="win-nav">
      <div className="links">
        <Link href="/library">Library</Link>
        <Link href="/artists">Artists</Link>
        <Link href="/albums">Albums</Link>
        <Link href="/playlists">Playlists</Link>
        <Link href="/upload">Upload</Link>
        <button type="button" className="win-button small disabled" disabled title="Not implemented">
          Connect to Soulseek
        </button>
        {isAdmin && <Link href="/admin/users">Admin: Users</Link>}
        {isAdmin && <Link href="/admin/artists">Admin: Artists</Link>}
        <Link href="/settings">Settings</Link>
      </div>
      <div>
        <span>{username}</span>
        <LogoutButton />
        <Link href="/about">About</Link>
      </div>
    </nav>
  );
}

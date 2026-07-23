// This page always reflects live, per-user session and DB state - never statically pre-render it.
export const dynamic = "force-dynamic";

import Link from "next/link";

import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function PlaylistsPage() {
  const user = await requireUser();
  const playlists = await prisma.playlist.findMany({
    include: { owner: true, songs: true },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <h1>Playlists</h1>
      <Link href="/playlists/new" className="win-button">
        New Playlist
      </Link>

      {playlists.length === 0 ? (
        <p>No playlists yet.</p>
      ) : (
        <div className="card-grid">
          {playlists.map((playlist) => {
            const coverUrl =
              playlist.imageEnabled && playlist.coverImagePath
                ? `/api/playlist-covers/${playlist.id}`
                : "/images/default-cover.png";
            const canEdit = playlist.ownerId === user.id || user.isAdmin;
            return (
              <Link key={playlist.id} href={`/playlists/${playlist.id}`} className="card">
                <img src={coverUrl} alt="" />
                <div className="name">{playlist.name}</div>
                <div>by {playlist.owner.username}</div>
                <div>
                  {playlist.songs.length} song{playlist.songs.length === 1 ? "" : "s"}
                  {canEdit ? " · editable" : ""}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

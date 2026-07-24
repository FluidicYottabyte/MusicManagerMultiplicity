// This page always reflects live, per-user session and DB state - never statically pre-render it.
export const dynamic = "force-dynamic";

import Link from "next/link";

import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

interface PlaylistCardData {
  id: string;
  name: string;
  ownerUsername: string;
  coverUrl: string;
  songCount: number;
  canEdit: boolean;
  isPublic: boolean;
}

function PlaylistCard({ playlist }: { playlist: PlaylistCardData }) {
  return (
    <Link href={`/playlists/${playlist.id}`} className="card">
      <img src={playlist.coverUrl} alt="" />
      <div className="name">{playlist.name}</div>
      <div>by {playlist.ownerUsername}</div>
      <div>
        {playlist.songCount} song{playlist.songCount === 1 ? "" : "s"}
        {playlist.canEdit ? " · editable" : ""}
        {!playlist.isPublic ? " · private" : ""}
      </div>
    </Link>
  );
}

export default async function PlaylistsPage() {
  const user = await requireUser();
  const playlists = await prisma.playlist.findMany({
    where: user.isAdmin ? {} : { OR: [{ isPublic: true }, { ownerId: user.id }] },
    include: { owner: true, songs: true },
    orderBy: { name: "asc" },
  });

  const toCard = (playlist: (typeof playlists)[number]): PlaylistCardData => ({
    id: playlist.id,
    name: playlist.name,
    ownerUsername: playlist.owner.username,
    coverUrl:
      playlist.imageEnabled && playlist.coverImagePath ? `/api/playlist-covers/${playlist.id}` : "/images/default-cover.png",
    songCount: playlist.songs.length,
    canEdit: playlist.ownerId === user.id || user.isAdmin,
    isPublic: playlist.isPublic,
  });

  const myPlaylists = playlists.filter((p) => p.ownerId === user.id).map(toCard);
  const otherPlaylists = playlists.filter((p) => p.ownerId !== user.id).map(toCard);

  return (
    <div>
      <h1>Playlists</h1>
      <Link href="/playlists/new" className="win-button">
        New Playlist
      </Link>

      {playlists.length === 0 ? (
        <p>No playlists yet.</p>
      ) : (
        <>
          <h3>My Playlists</h3>
          {myPlaylists.length === 0 ? (
            <p>You haven&apos;t made any playlists yet.</p>
          ) : (
            <div className="card-grid playlist-scroll-grid">
              {myPlaylists.map((playlist) => (
                <PlaylistCard key={playlist.id} playlist={playlist} />
              ))}
            </div>
          )}

          <hr className="section-divider" />

          <h3>Other Playlists</h3>
          {otherPlaylists.length === 0 ? (
            <p>No other playlists to see yet.</p>
          ) : (
            <div className="card-grid">
              {otherPlaylists.map((playlist) => (
                <PlaylistCard key={playlist.id} playlist={playlist} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

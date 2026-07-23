// This page always reflects live, per-user session and DB state - never statically pre-render it.
export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";

import { SongList } from "@/components/SongList";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getEditablePlaylists } from "@/lib/editablePlaylists";
import type { SongView } from "@/types/song";

import { AlbumActions } from "./AlbumActions";

export default async function AlbumDetailPage({ params }: { params: { albumId: string } }) {
  const user = await requireUser();
  const album = await prisma.album.findUnique({
    where: { id: params.albumId },
    include: {
      artists: { include: { artist: true } },
      songs: {
        // Actual track order when known (from file metadata at upload
        // time), falling back to title for songs with no track number.
        orderBy: [{ trackNumber: { sort: "asc", nulls: "last" } }, { title: "asc" }],
        include: { artists: { include: { artist: true } }, album: true },
      },
    },
  });

  if (!album) notFound();

  const songs: SongView[] = album.songs.map((song) => ({
    id: song.id,
    title: song.title,
    artists: song.artists.map((a) => ({ id: a.artist.id, name: a.artist.name })),
    album: song.album ? { id: song.album.id, name: song.album.name } : null,
    coverUrl: song.coverImagePath ? `/api/covers/${song.id}` : "/images/default-cover.png",
  }));

  const coverUrl = songs.find((s) => s.coverUrl !== "/images/default-cover.png")?.coverUrl ?? "/images/default-cover.png";
  const editablePlaylists = await getEditablePlaylists(user.id, user.isAdmin);

  return (
    <div>
      <div className="album-header">
        <img className="album-cover-large" src={coverUrl} alt="" />
        <div>
          <h1>{album.name}</h1>
          <p className="song-row-links">
            {album.artists.length === 0 && "Unknown artist"}
            {album.artists.map((a, i) => (
              <span key={a.artist.id}>
                {i > 0 && ", "}
                <Link href={`/artists/${a.artist.id}`}>{a.artist.name}</Link>
              </span>
            ))}
          </p>
          <AlbumActions songs={songs} editablePlaylists={editablePlaylists} />
        </div>
      </div>
      <SongList
        songs={songs}
        emptyMessage="No songs in this album."
        isAdmin={user.isAdmin}
        editablePlaylists={editablePlaylists}
      />
    </div>
  );
}

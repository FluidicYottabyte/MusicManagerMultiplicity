// This page always reflects live, per-user session and DB state - never statically pre-render it.
export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";

import { SongList } from "@/components/SongList";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getEditablePlaylists } from "@/lib/editablePlaylists";
import type { SongView } from "@/types/song";

import { setArtistPhoto } from "../actions";

export default async function ArtistDetailPage({
  params,
  searchParams,
}: {
  params: { artistId: string };
  searchParams: { error?: string };
}) {
  const user = await requireUser();
  const artist = await prisma.artist.findUnique({
    where: { id: params.artistId },
    include: {
      songs: {
        include: { song: { include: { artists: { include: { artist: true } }, album: true } } },
      },
    },
  });

  if (!artist) notFound();

  const songs: SongView[] = artist.songs
    .map((sa) => sa.song)
    .sort((a, b) => a.title.localeCompare(b.title))
    .map((song) => ({
      id: song.id,
      title: song.title,
      artists: song.artists.map((a) => ({ id: a.artist.id, name: a.artist.name })),
      album: song.album ? { id: song.album.id, name: song.album.name } : null,
      coverUrl: song.coverImagePath ? `/api/covers/${song.id}` : "/images/default-cover.png",
    }));

  const editablePlaylists = await getEditablePlaylists(user.id, user.isAdmin);
  const boundSetPhoto = setArtistPhoto.bind(null, artist.id);

  return (
    <div>
      <img
        className="artist-photo"
        src={artist.photoPath ? `/api/artist-photos/${artist.id}` : "/images/default-cover.png"}
        alt=""
      />
      <h1>{artist.name}</h1>
      {searchParams.error && <div className="error-message">{searchParams.error.replace(/\+/g, " ")}</div>}
      <form action={boundSetPhoto} className="win-panel win-raised">
        <label htmlFor="photo">Set artist photo</label>
        <input id="photo" type="file" name="photo" accept=".png,.jpg,.jpeg,.gif" required />
        <button type="submit" className="win-button small">
          Save Photo
        </button>
      </form>
      <SongList
        songs={songs}
        emptyMessage="No songs for this artist."
        isAdmin={user.isAdmin}
        editablePlaylists={editablePlaylists}
      />
    </div>
  );
}

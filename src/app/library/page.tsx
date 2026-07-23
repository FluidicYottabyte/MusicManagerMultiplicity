// This page always reflects live, per-user session and DB state - never statically pre-render it.
export const dynamic = "force-dynamic";

import { SongList } from "@/components/SongList";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getEditablePlaylists } from "@/lib/editablePlaylists";
import type { SongView } from "@/types/song";

function coverUrl(songId: string, hasCover: boolean): string {
  return hasCover ? `/api/covers/${songId}` : "/images/default-cover.png";
}

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: { q?: string; uploaded?: string; failed?: string };
}) {
  const user = await requireUser();
  const q = searchParams.q?.trim() ?? "";

  const songs = await prisma.song.findMany({
    include: { artists: { include: { artist: true } }, album: true },
    orderBy: { title: "asc" },
  });

  const views: SongView[] = songs.map((song) => ({
    id: song.id,
    title: song.title,
    artists: song.artists.map((sa) => ({ id: sa.artist.id, name: sa.artist.name })),
    album: song.album ? { id: song.album.id, name: song.album.name } : null,
    coverUrl: coverUrl(song.id, song.coverImagePath !== null),
  }));

  const filtered = q
    ? views.filter((v) => {
        const haystack = `${v.title} ${v.artists.map((a) => a.name).join(" ")} ${v.album?.name ?? ""}`.toLowerCase();
        return haystack.includes(q.toLowerCase());
      })
    : views;

  const editablePlaylists = await getEditablePlaylists(user.id, user.isAdmin);

  return (
    <div>
      <h1>Library</h1>
      {searchParams.uploaded && (
        <div className="info-message">
          Uploaded {searchParams.uploaded} song{searchParams.uploaded === "1" ? "" : "s"}.
          {searchParams.failed ? ` ${searchParams.failed} file(s) were skipped (unsupported or not audio).` : ""}
        </div>
      )}
      <form method="GET" className="win-panel win-raised">
        <label htmlFor="q">Search</label>
        <input id="q" name="q" type="search" defaultValue={q} placeholder="Title, artist, or album" />
        <button type="submit" className="win-button small">
          Search
        </button>
      </form>
      <SongList
        songs={filtered}
        emptyMessage={q ? "No matching songs." : "No songs uploaded yet."}
        isAdmin={user.isAdmin}
        editablePlaylists={editablePlaylists}
      />
    </div>
  );
}

import { SongList } from "@/components/SongList";
import { prisma } from "@/lib/db";
import type { SongView } from "@/types/song";

function coverUrl(songId: string, hasCover: boolean): string {
  return hasCover ? `/api/covers/${songId}` : "/images/default-cover.png";
}

export default async function LibraryPage({ searchParams }: { searchParams: { q?: string } }) {
  const q = searchParams.q?.trim() ?? "";

  const songs = await prisma.song.findMany({
    include: { artists: { include: { artist: true } }, album: true },
    orderBy: { title: "asc" },
  });

  const views: SongView[] = songs.map((song) => ({
    id: song.id,
    title: song.title,
    artistNames: song.artists.map((sa) => sa.artist.name).join(", "),
    albumName: song.album?.name ?? null,
    coverUrl: coverUrl(song.id, song.coverImagePath !== null),
  }));

  const filtered = q
    ? views.filter((v) => {
        const haystack = `${v.title} ${v.artistNames} ${v.albumName ?? ""}`.toLowerCase();
        return haystack.includes(q.toLowerCase());
      })
    : views;

  return (
    <div>
      <h1>Library</h1>
      <form method="GET" className="win-panel win-raised">
        <label htmlFor="q">Search</label>
        <input id="q" name="q" type="search" defaultValue={q} placeholder="Title, artist, or album" />
        <button type="submit" className="win-button small">
          Search
        </button>
      </form>
      <SongList songs={filtered} emptyMessage={q ? "No matching songs." : "No songs uploaded yet."} />
    </div>
  );
}

// This page always reflects live, per-user session and DB state - never statically pre-render it.
export const dynamic = "force-dynamic";

import { Prisma } from "@prisma/client";

import { Pagination } from "@/components/Pagination";
import { SearchForm } from "@/components/SearchForm";
import { SongList } from "@/components/SongList";
import { SortTabs } from "@/components/SortTabs";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getEditablePlaylists } from "@/lib/editablePlaylists";
import type { SongView } from "@/types/song";

function coverUrl(songId: string, hasCover: boolean): string {
  return hasCover ? `/api/covers/${songId}` : "/images/default-cover.png";
}

// Loading (and downloading a cover thumbnail for) the entire library at once
// is what made the page take ~a minute to become interactive with a large
// collection - so only ever fetch one page of songs at a time.
const PAGE_SIZE = 60;

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: { q?: string; uploaded?: string; failed?: string; sort?: string; page?: string };
}) {
  const user = await requireUser();
  const q = searchParams.q?.trim() ?? "";
  const sort = searchParams.sort === "newest" || searchParams.sort === "oldest" ? searchParams.sort : "title";
  const page = Math.max(1, Number.parseInt(searchParams.page ?? "1", 10) || 1);

  const where: Prisma.SongWhereInput = q
    ? {
        OR: [
          { title: { contains: q } },
          { artists: { some: { artist: { name: { contains: q } } } } },
          { album: { name: { contains: q } } },
        ],
      }
    : {};

  const totalCount = await prisma.song.count({ where });
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  const songs = await prisma.song.findMany({
    where,
    include: { artists: { include: { artist: true } }, album: true },
    orderBy: sort === "newest" ? { createdAt: "desc" } : sort === "oldest" ? { createdAt: "asc" } : { title: "asc" },
    skip: (currentPage - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
  });

  const filtered: SongView[] = songs.map((song) => ({
    id: song.id,
    title: song.title,
    artists: song.artists.map((sa) => ({ id: sa.artist.id, name: sa.artist.name })),
    album: song.album ? { id: song.album.id, name: song.album.name } : null,
    coverUrl: coverUrl(song.id, song.coverImagePath !== null),
  }));

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
      <SearchForm action="/library" placeholder="Title, artist, or album" defaultValue={q} />
      <SortTabs basePath="/library" q={q} current={sort} />
      <SongList
        songs={filtered}
        emptyMessage={q ? "No matching songs." : "No songs uploaded yet."}
        isAdmin={user.isAdmin}
        editablePlaylists={editablePlaylists}
      />
      <Pagination basePath="/library" q={q} sort={sort} page={currentPage} totalPages={totalPages} />
    </div>
  );
}

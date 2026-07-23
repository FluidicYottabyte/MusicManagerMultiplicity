// This page always reflects live, per-user session and DB state - never statically pre-render it.
export const dynamic = "force-dynamic";

import Link from "next/link";

import { prisma } from "@/lib/db";

export default async function AlbumsPage() {
  const albums = await prisma.album.findMany({
    include: { songs: true },
    orderBy: { name: "asc" },
  });

  if (albums.length === 0) {
    return (
      <div>
        <h1>Albums</h1>
        <p>No albums yet — upload some songs first.</p>
      </div>
    );
  }

  return (
    <div>
      <h1>Albums</h1>
      <div className="card-grid">
        {albums.map((album) => {
          const firstWithCover = album.songs.find((s) => s.coverImagePath !== null);
          const coverUrl = firstWithCover ? `/api/covers/${firstWithCover.id}` : "/images/default-cover.png";
          return (
            <Link key={album.id} href={`/albums/${album.id}`} className="card">
              <img src={coverUrl} alt="" />
              <div className="name">{album.name}</div>
              <div>{album.songs.length} song{album.songs.length === 1 ? "" : "s"}</div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

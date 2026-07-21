import Link from "next/link";

import { prisma } from "@/lib/db";

export default async function ArtistsPage() {
  const artists = await prisma.artist.findMany({
    include: { songs: true },
    orderBy: { name: "asc" },
  });

  if (artists.length === 0) {
    return (
      <div>
        <h1>Artists</h1>
        <p>No artists yet — upload some songs first.</p>
      </div>
    );
  }

  return (
    <div>
      <h1>Artists</h1>
      <div className="card-grid">
        {artists.map((artist) => (
          <Link key={artist.id} href={`/artists/${artist.id}`} className="card">
            <img src="/images/default-cover.png" alt="" />
            <div className="name">{artist.name}</div>
            <div>{artist.songs.length} song{artist.songs.length === 1 ? "" : "s"}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}

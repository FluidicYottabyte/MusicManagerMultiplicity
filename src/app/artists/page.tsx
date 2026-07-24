// This page always reflects live, per-user session and DB state - never statically pre-render it.
export const dynamic = "force-dynamic";

import Link from "next/link";

import { SearchForm } from "@/components/SearchForm";
import { prisma } from "@/lib/db";

export default async function ArtistsPage({ searchParams }: { searchParams: { q?: string } }) {
  const q = searchParams.q?.trim() ?? "";

  const allArtists = await prisma.artist.findMany({
    include: { songs: true },
    orderBy: { name: "asc" },
  });

  const artists = q ? allArtists.filter((a) => a.name.toLowerCase().includes(q.toLowerCase())) : allArtists;

  return (
    <div>
      <h1>Artists</h1>
      <SearchForm action="/artists" placeholder="Artist name" defaultValue={q} />

      {artists.length === 0 ? (
        <p>{q ? "No matching artists." : "No artists yet — upload some songs first."}</p>
      ) : (
        <div className="card-grid">
          {artists.map((artist) => (
            <Link key={artist.id} href={`/artists/${artist.id}`} className="card">
              <img src={artist.photoPath ? `/api/artist-photos/${artist.id}` : "/images/default-cover.png"} alt="" />
              <div className="name">{artist.name}</div>
              <div>
                {artist.songs.length} song{artist.songs.length === 1 ? "" : "s"}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

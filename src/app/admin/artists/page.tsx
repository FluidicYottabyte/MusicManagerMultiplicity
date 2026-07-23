// This page always reflects live, per-user session and DB state - never statically pre-render it.
export const dynamic = "force-dynamic";

import Link from "next/link";

import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";

import { mergeArtists } from "./actions";

export default async function AdminArtistsPage({
  searchParams,
}: {
  searchParams: { error?: string; merged?: string };
}) {
  await requireAdmin();
  const artists = await prisma.artist.findMany({
    include: { songs: true },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <h1>Manage Artists</h1>
      <Link href="/admin/users" className="win-button small">
        Manage Users
      </Link>
      {searchParams.error && <div className="error-message">{searchParams.error.replace(/\+/g, " ")}</div>}
      {searchParams.merged && <div className="info-message">Artists merged.</div>}

      <div className="win-panel win-raised">
        <h3>Merge Duplicate Artists</h3>
        <p>
          If the same artist got added twice under slightly different names, pick which one to keep - every song and
          album credited to the other one moves over to it, and the duplicate is deleted.
        </p>
        {artists.length < 2 ? (
          <p>Need at least two artists to merge.</p>
        ) : (
          <form action={mergeArtists}>
            <label htmlFor="keepArtistId">Keep this artist</label>
            <select id="keepArtistId" name="keepArtistId" required>
              {artists.map((artist) => (
                <option key={artist.id} value={artist.id}>
                  {artist.name} ({artist.songs.length} song{artist.songs.length === 1 ? "" : "s"})
                </option>
              ))}
            </select>

            <label htmlFor="mergeArtistId">Merge and delete this one</label>
            <select id="mergeArtistId" name="mergeArtistId" required>
              {artists.map((artist) => (
                <option key={artist.id} value={artist.id}>
                  {artist.name} ({artist.songs.length} song{artist.songs.length === 1 ? "" : "s"})
                </option>
              ))}
            </select>

            <button type="submit" className="win-button">
              Merge
            </button>
          </form>
        )}
      </div>

      <table className="rows win-sunken">
        <tbody>
          {artists.map((artist) => (
            <tr key={artist.id}>
              <td>
                <Link href={`/artists/${artist.id}`}>{artist.name}</Link>
              </td>
              <td>
                {artist.songs.length} song{artist.songs.length === 1 ? "" : "s"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

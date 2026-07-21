import { createPlaylist } from "../actions";

export default function NewPlaylistPage({ searchParams }: { searchParams: { error?: string } }) {
  return (
    <div>
      <h1>New Playlist</h1>
      {searchParams.error && <div className="error-message">{searchParams.error.replace(/\+/g, " ")}</div>}
      <form action={createPlaylist} className="win-panel win-raised">
        <label htmlFor="name">Name</label>
        <input id="name" type="text" name="name" required />

        <label htmlFor="imageEnabled">
          <input id="imageEnabled" type="checkbox" name="imageEnabled" style={{ width: "auto", marginRight: 6 }} />
          Use a custom cover image
        </label>

        <label htmlFor="coverImage">Cover image (optional)</label>
        <input id="coverImage" type="file" name="coverImage" accept=".png,.jpg,.jpeg,.gif" />

        <button type="submit" className="win-button">
          Create
        </button>
      </form>
    </div>
  );
}

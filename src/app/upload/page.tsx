import { uploadSong } from "./actions";

export default function UploadPage({ searchParams }: { searchParams: { error?: string } }) {
  return (
    <div>
      <h1>Upload a Song</h1>
      {searchParams.error && <div className="error-message">{searchParams.error.replace(/\+/g, " ")}</div>}
      <form action={uploadSong} className="win-panel win-raised">
        <label htmlFor="file">Audio file</label>
        <input id="file" type="file" name="file" accept=".mp3,.m4a,.aac,.flac,.wav,.ogg,.aiff,.aif" required />

        <label htmlFor="title">Title (optional — read from the file if left blank)</label>
        <input id="title" type="text" name="title" />

        <label htmlFor="artistNames">Artist(s) — comma-separated (optional)</label>
        <input id="artistNames" type="text" name="artistNames" />

        <label htmlFor="albumName">Album (optional)</label>
        <input id="albumName" type="text" name="albumName" />

        <button type="submit" className="win-button">
          Upload
        </button>
      </form>
    </div>
  );
}

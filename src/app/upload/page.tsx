import { uploadSong } from "./actions";

// webkitdirectory/directory aren't in React's DOM typings but are
// widely-supported non-standard attributes that let a folder be chosen
// as if every file inside it had been multi-selected.
const folderInputProps = { webkitdirectory: "", directory: "" } as React.InputHTMLAttributes<HTMLInputElement>;

export default function UploadPage({ searchParams }: { searchParams: { error?: string } }) {
  return (
    <div>
      <h1>Upload Songs</h1>
      {searchParams.error && <div className="error-message">{searchParams.error.replace(/\+/g, " ")}</div>}
      <form action={uploadSong} className="win-panel win-raised">
        <label htmlFor="files">Audio file(s)</label>
        <input
          id="files"
          type="file"
          name="file"
          accept=".mp3,.m4a,.aac,.flac,.wav,.ogg,.aiff,.aif"
          multiple
        />

        <label htmlFor="folder">...or choose an entire folder (any non-audio files inside are skipped)</label>
        <input id="folder" type="file" name="file" multiple {...folderInputProps} />

        <label htmlFor="title">Title (single file only — read from the file if left blank)</label>
        <input id="title" type="text" name="title" />

        <label htmlFor="artistNames">Artist(s) — comma-separated (single file only)</label>
        <input id="artistNames" type="text" name="artistNames" />

        <label htmlFor="albumName">Album (single file only)</label>
        <input id="albumName" type="text" name="albumName" />

        <button type="submit" className="win-button">
          Upload
        </button>
      </form>
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

// webkitdirectory/directory aren't in React's DOM typings but are
// widely-supported non-standard attributes that let a folder be chosen
// as if every file inside it had been multi-selected.
const folderInputProps = { webkitdirectory: "", directory: "" } as React.InputHTMLAttributes<HTMLInputElement>;

interface UploadStatus {
  currentIndex: number;
  total: number;
  currentFileName: string;
  currentFileProgress: number;
  succeeded: number;
  failed: number;
}

interface UploadApiResult {
  ok: boolean;
  reason?: string;
}

function uploadOneFile(
  file: File,
  overrides: { title: string; artistNames: string; albumName: string } | null,
  onProgress: (pct: number) => void
): Promise<UploadApiResult> {
  return new Promise((resolve) => {
    const formData = new FormData();
    formData.set("file", file);
    if (overrides) {
      if (overrides.title) formData.set("title", overrides.title);
      if (overrides.artistNames) formData.set("artistNames", overrides.artistNames);
      if (overrides.albumName) formData.set("albumName", overrides.albumName);
    }

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/upload");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      try {
        resolve(JSON.parse(xhr.responseText) as UploadApiResult);
      } catch {
        resolve({ ok: xhr.status >= 200 && xhr.status < 300, reason: "Unexpected server response" });
      }
    };
    xhr.onerror = () => resolve({ ok: false, reason: "Network error" });
    xhr.send(formData);
  });
}

export function UploadForm() {
  const router = useRouter();
  const filesInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const artistRef = useRef<HTMLInputElement>(null);
  const albumRef = useRef<HTMLInputElement>(null);

  const [status, setStatus] = useState<UploadStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const files: File[] = [
      ...(filesInputRef.current?.files ? Array.from(filesInputRef.current.files) : []),
      ...(folderInputRef.current?.files ? Array.from(folderInputRef.current.files) : []),
    ];

    if (files.length === 0) {
      setError("Please choose at least one file or folder.");
      return;
    }

    const overrides =
      files.length === 1
        ? {
            title: titleRef.current?.value.trim() ?? "",
            artistNames: artistRef.current?.value.trim() ?? "",
            albumName: albumRef.current?.value.trim() ?? "",
          }
        : null;

    let succeeded = 0;
    let failed = 0;
    setStatus({ currentIndex: 0, total: files.length, currentFileName: files[0]!.name, currentFileProgress: 0, succeeded, failed });

    for (let i = 0; i < files.length; i++) {
      const file = files[i]!;
      setStatus((s) => (s ? { ...s, currentIndex: i, currentFileName: file.name, currentFileProgress: 0 } : s));

      const result = await uploadOneFile(file, overrides, (pct) => {
        setStatus((s) => (s ? { ...s, currentFileProgress: pct } : s));
      });

      if (result.ok) {
        succeeded++;
      } else {
        failed++;
      }
      setStatus((s) => (s ? { ...s, succeeded, failed } : s));
    }

    const params = new URLSearchParams({ uploaded: String(succeeded) });
    if (failed > 0) params.set("failed", String(failed));
    router.push(`/library?${params.toString()}`);
  }

  const uploading = status !== null;

  return (
    <form onSubmit={handleSubmit} className="win-panel win-raised">
      <label htmlFor="files">Audio file(s)</label>
      <input
        id="files"
        type="file"
        ref={filesInputRef}
        accept=".mp3,.m4a,.aac,.flac,.wav,.ogg,.aiff,.aif"
        multiple
        disabled={uploading}
      />

      <label htmlFor="folder">...or choose an entire folder (any non-audio files inside are skipped)</label>
      <input id="folder" type="file" ref={folderInputRef} multiple disabled={uploading} {...folderInputProps} />

      <label htmlFor="title">Title (single file only — read from the file if left blank)</label>
      <input id="title" type="text" ref={titleRef} disabled={uploading} />

      <label htmlFor="artistNames">Artist(s) — comma-separated (single file only)</label>
      <input id="artistNames" type="text" ref={artistRef} disabled={uploading} />

      <label htmlFor="albumName">Album (single file only)</label>
      <input id="albumName" type="text" ref={albumRef} disabled={uploading} />

      {error && <div className="error-message">{error}</div>}

      {status && (
        <div className="win-sunken upload-progress">
          <div>
            Uploading {status.currentIndex + 1} of {status.total}: {status.currentFileName}
          </div>
          <progress value={status.currentFileProgress} max={100} />
          <div>
            {status.succeeded} succeeded, {status.failed} failed so far
          </div>
        </div>
      )}

      <button type="submit" className="win-button" disabled={uploading}>
        {uploading ? "Uploading..." : "Upload"}
      </button>
    </form>
  );
}

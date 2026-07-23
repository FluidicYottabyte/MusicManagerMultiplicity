import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export interface ExtractedMetadata {
  title: string | null;
  artist: string | null;
  album: string | null;
  trackNumber: number | null;
  durationSeconds: number | null;
  hasAudioStream: boolean;
}

interface FFProbeStream {
  codec_type?: string;
}

interface FFProbeFormat {
  duration?: string;
  tags?: Record<string, string>;
}

interface FFProbeOutput {
  streams?: FFProbeStream[];
  format?: FFProbeFormat;
}

const empty: ExtractedMetadata = {
  title: null,
  artist: null,
  album: null,
  trackNumber: null,
  durationSeconds: null,
  hasAudioStream: false,
};

/** Tags store this as "5", "05", or "5/12" (track 5 of 12) - only the leading number matters. */
function parseTrackNumber(raw: string | undefined): number | null {
  if (!raw) return null;
  const match = /^\s*(\d+)/.exec(raw);
  if (!match) return null;
  const n = Number.parseInt(match[1]!, 10);
  return Number.isFinite(n) ? n : null;
}

/** Runs ffprobe and extracts tags case-insensitively (files tag their metadata inconsistently: "Artist" vs "artist" vs "ARTIST"). */
export async function probe(inputPath: string): Promise<ExtractedMetadata> {
  let stdout: string;
  try {
    ({ stdout } = await execFileAsync(
      "ffprobe",
      ["-v", "quiet", "-print_format", "json", "-show_format", "-show_streams", inputPath],
      { maxBuffer: 1024 * 1024 * 16 }
    ));
  } catch {
    return empty;
  }

  let parsed: FFProbeOutput;
  try {
    parsed = JSON.parse(stdout) as FFProbeOutput;
  } catch {
    return empty;
  }

  const hasAudioStream = (parsed.streams ?? []).some((s) => s.codec_type === "audio");

  const rawTags = parsed.format?.tags ?? {};
  const tags: Record<string, string> = {};
  for (const [key, value] of Object.entries(rawTags)) {
    tags[key.toLowerCase()] = value;
  }

  const durationRaw = parsed.format?.duration;
  const durationSeconds = durationRaw !== undefined ? Number.parseFloat(durationRaw) : NaN;

  return {
    title: tags.title ?? null,
    artist: tags.artist ?? null,
    album: tags.album ?? null,
    trackNumber: parseTrackNumber(tags.track),
    durationSeconds: Number.isFinite(durationSeconds) ? durationSeconds : null,
    hasAudioStream,
  };
}

import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

/**
 * All ffmpeg/ffprobe invocations go through argument arrays (never a shell
 * string) so user-controlled filenames can never be interpreted as shell
 * syntax.
 */
async function run(bin: "ffmpeg" | "ffprobe", args: string[]): Promise<{ stdout: string; stderr: string }> {
  return execFileAsync(bin, args, { maxBuffer: 1024 * 1024 * 16 });
}

/**
 * Transcodes any supported input audio file to AAC-LC in an .m4a container
 * at 192kbps CBR with +faststart, chosen for broad browser/mobile
 * compatibility, license-safe encoding (no libfdk_aac), and a reasonable
 * quality/bandwidth tradeoff for streaming over the internet.
 */
export async function transcodeToAAC(inputPath: string, outputPath: string): Promise<void> {
  await run("ffmpeg", [
    "-y",
    "-i",
    inputPath,
    "-vn",
    "-map",
    "0:a:0",
    "-c:a",
    "aac",
    "-b:a",
    "192k",
    "-movflags",
    "+faststart",
    outputPath,
  ]);
}

/**
 * Extracts embedded cover art (e.g. an ID3 APIC frame) as a JPEG, if
 * present. Returns false (without throwing) when the input has no
 * attached picture, which is a normal, expected case.
 */
export async function extractCoverArt(inputPath: string, outputPath: string): Promise<boolean> {
  try {
    await run("ffmpeg", ["-y", "-i", inputPath, "-an", "-map", "0:v:0?", "-frames:v", "1", outputPath]);
    return true;
  } catch {
    return false;
  }
}

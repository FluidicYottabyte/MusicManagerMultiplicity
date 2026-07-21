import Foundation

/// Wraps ffmpeg via `Process`, always with argument arrays — never a
/// string-interpolated shell command — so no upload-supplied data can be
/// interpreted as a shell flag or command.
enum TranscodeService {
    struct TranscodeError: Error, CustomStringConvertible {
        let description: String
    }

    /// Transcodes `inputPath` to AAC-LC in an .m4a container at 192kbps CBR
    /// with a faststart moov atom (so the browser can seek without waiting on
    /// the full file), writing to `outputPath`.
    static func transcodeToAAC(inputPath: String, outputPath: String) async throws {
        try await run(arguments: [
            "-y",
            "-i", inputPath,
            "-vn",
            "-c:a", "aac",
            "-b:a", "192k",
            "-movflags", "+faststart",
            outputPath,
        ])
    }

    /// Extracts embedded cover art (if any) from `inputPath` to `outputPath`.
    /// Returns false (leaving no file behind) if the source has no embedded art
    /// or extraction otherwise fails — this is a best-effort convenience, not
    /// something upload should fail over.
    static func extractCoverArt(inputPath: String, outputPath: String) async -> Bool {
        do {
            try await run(arguments: [
                "-y",
                "-i", inputPath,
                "-an",
                "-vcodec", "copy",
                outputPath,
            ])
            return FileManager.default.fileExists(atPath: outputPath)
        } catch {
            return false
        }
    }

    private static func run(arguments: [String]) async throws {
        try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<Void, Error>) in
            let process = Process()
            process.executableURL = URL(fileURLWithPath: "/usr/bin/env")
            process.arguments = ["ffmpeg"] + arguments

            let stderrPipe = Pipe()
            process.standardError = stderrPipe
            process.standardOutput = Pipe()

            process.terminationHandler = { proc in
                if proc.terminationStatus == 0 {
                    continuation.resume()
                } else {
                    let errData = stderrPipe.fileHandleForReading.readDataToEndOfFile()
                    let errString = String(data: errData, encoding: .utf8) ?? "unknown ffmpeg error"
                    continuation.resume(
                        throwing: TranscodeError(
                            description: "ffmpeg exited with status \(proc.terminationStatus): \(errString)"
                        )
                    )
                }
            }

            do {
                try process.run()
            } catch {
                continuation.resume(throwing: error)
            }
        }
    }
}

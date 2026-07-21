import Foundation

struct ExtractedMetadata {
    var title: String?
    var artist: String?
    var album: String?
    var durationSeconds: Double?
    var hasAudioStream: Bool
}

/// Wraps ffprobe (argument array only, same rationale as `TranscodeService`)
/// to prefill the upload form and to reject files that merely have an
/// audio-sounding extension but no actual audio stream.
enum MetadataExtractor {
    static func probe(inputPath: String) async -> ExtractedMetadata {
        let arguments = [
            "ffprobe",
            "-v", "quiet",
            "-print_format", "json",
            "-show_format",
            "-show_streams",
            inputPath,
        ]

        guard let data = try? await runCapturingStdout(arguments: arguments),
            let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any]
        else {
            return ExtractedMetadata(hasAudioStream: false)
        }

        let streams = json["streams"] as? [[String: Any]] ?? []
        let hasAudio = streams.contains { ($0["codec_type"] as? String) == "audio" }

        let format = json["format"] as? [String: Any]
        let rawTags = format?["tags"] as? [String: Any] ?? [:]
        var tags: [String: String] = [:]
        for (key, value) in rawTags {
            if let stringValue = value as? String {
                tags[key.lowercased()] = stringValue
            }
        }

        let duration = (format?["duration"] as? String).flatMap(Double.init)

        return ExtractedMetadata(
            title: tags["title"],
            artist: tags["artist"],
            album: tags["album"],
            durationSeconds: duration,
            hasAudioStream: hasAudio
        )
    }

    private static func runCapturingStdout(arguments: [String]) async throws -> Data {
        try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<Data, Error>) in
            let process = Process()
            process.executableURL = URL(fileURLWithPath: "/usr/bin/env")
            process.arguments = arguments

            let stdoutPipe = Pipe()
            process.standardOutput = stdoutPipe
            process.standardError = Pipe()

            process.terminationHandler = { _ in
                let data = stdoutPipe.fileHandleForReading.readDataToEndOfFile()
                continuation.resume(returning: data)
            }

            do {
                try process.run()
            } catch {
                continuation.resume(throwing: error)
            }
        }
    }
}
